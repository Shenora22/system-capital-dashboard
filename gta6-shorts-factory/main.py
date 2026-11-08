"""
main.py

Runs the whole factory loop once:

  1. Find the most-viewed GTA VI clips from the last 24 hours that were not used before
  2. Download them into a temporary work folder
  3. Write title, hook, description and hashtags with Gemini
  4. Render a 1080x1920 Short
  5. Upload it to YouTube
  6. Record the clip IDs as used and delete every temporary file

Usage:
    python main.py              # full run, uploads to YouTube
    python main.py --dry-run    # renders the Short but uploads nothing and marks nothing used

Exit codes:
    0  success (or dry run finished)
    1  error (details in logs/factory.log)
    2  not enough fresh clips today, so nothing was produced
"""

from __future__ import annotations

import argparse
import fcntl
import json
import logging
import shutil
import sys
import time
from contextlib import contextmanager
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler
from typing import Iterator

import config
import metadata_agent
import twitch_downloader
import video_editor
import youtube_uploader

log = logging.getLogger("factory")

EXIT_OK = 0
EXIT_ERROR = 1
EXIT_NOT_ENOUGH_CLIPS = 2

MIN_CLIPS_PER_SHORT = 3
STALE_WORK_HOURS = 12
MAX_REMEMBERED_CLIP_IDS = 5000  # the used-clip history is capped so the file stays small


class AlreadyRunningError(RuntimeError):
    """Another factory run holds the lock."""


# -- logging -------------------------------------------------------------------
def setup_logging() -> None:
    config.LOG_DIR.mkdir(parents=True, exist_ok=True)
    fmt = logging.Formatter("%(asctime)s %(levelname)-7s %(name)s: %(message)s")

    root = logging.getLogger()
    root.setLevel(logging.INFO)
    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(fmt)
    logfile = RotatingFileHandler(config.LOG_DIR / "factory.log", maxBytes=5_000_000, backupCount=3)
    logfile.setFormatter(fmt)
    root.addHandler(console)
    root.addHandler(logfile)


# -- state: which clips were already used -------------------------------------
STATE_FILE = config.STATE_DIR / "state.json"


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return {"used_clip_ids": [], "uploads": []}


def save_state(state: dict) -> None:
    state["used_clip_ids"] = state["used_clip_ids"][-MAX_REMEMBERED_CLIP_IDS:]
    state["uploads"] = state["uploads"][-500:]
    config.STATE_DIR.mkdir(parents=True, exist_ok=True)
    tmp = STATE_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(state, indent=2), encoding="utf-8")
    tmp.replace(STATE_FILE)  # atomic: a crash never leaves a half-written file


# -- guard against overlapping cron runs --------------------------------------
@contextmanager
def single_instance() -> Iterator[None]:
    config.STATE_DIR.mkdir(parents=True, exist_ok=True)
    lock_handle = (config.STATE_DIR / "factory.lock").open("w")
    try:
        fcntl.flock(lock_handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError as exc:
        lock_handle.close()
        raise AlreadyRunningError("Another run is still in progress") from exc
    try:
        yield
    finally:
        fcntl.flock(lock_handle, fcntl.LOCK_UN)
        lock_handle.close()


# -- disk hygiene --------------------------------------------------------------
def purge_stale_files() -> None:
    """Remove leftovers from crashed runs so the disk never fills up."""
    cutoff = time.time() - STALE_WORK_HOURS * 3600
    if config.WORK_DIR.exists():
        for child in config.WORK_DIR.iterdir():
            if child.stat().st_mtime < cutoff:
                if child.is_dir():
                    shutil.rmtree(child, ignore_errors=True)
                else:
                    child.unlink(missing_ok=True)
                log.info("Removed stale work item %s", child.name)


# -- one full run --------------------------------------------------------------
def run_once(upload: bool) -> int:
    state = load_state()
    used_ids = set(state["used_clip_ids"])
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    run_dir = config.WORK_DIR / stamp
    output_path = config.OUTPUT_DIR / f"short_{stamp}.mp4"

    try:
        picked = twitch_downloader.fetch_clips_for_short(
            used_ids=used_ids,
            work_dir=run_dir,
            count=config.CLIPS_PER_SHORT,
            lookback_hours=config.TWITCH_LOOKBACK_HOURS,
        )
        if len(picked) < MIN_CLIPS_PER_SHORT:
            log.warning("Only %d usable clip(s); need %d. Nothing produced today.", len(picked), MIN_CLIPS_PER_SHORT)
            return EXIT_NOT_ENOUGH_CLIPS

        clips = [clip for clip, _ in picked]
        meta = metadata_agent.generate_metadata(clips)
        log.info("Title: %s", meta.title)

        video_editor.build_short(
            clips=[(path, clip.creator_name) for clip, path in picked],
            hook=meta.hook,
            output_path=output_path,
        )

        if upload:
            video_id = youtube_uploader.upload_short(
                video_path=output_path,
                title=meta.title,
                description=meta.description,
                hashtags=meta.hashtags,
            )
            log.info("Published https://youtube.com/shorts/%s", video_id)
            state["uploads"].append(
                {
                    "video_id": video_id,
                    "title": meta.title,
                    "clip_ids": [c.id for c in clips],
                    "uploaded_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            # Only mark clips as used once the Short is really published.
            state["used_clip_ids"].extend(c.id for c in clips)
            save_state(state)
        else:
            log.info("Dry run: rendered %s. Nothing uploaded and no clips marked as used.", output_path)
        return EXIT_OK

    finally:
        shutil.rmtree(run_dir, ignore_errors=True)  # downloaded source clips
        keep_render = config.KEEP_OUTPUT or not upload  # keep dry-run renders so you can review them
        if output_path.exists() and not keep_render:
            output_path.unlink()
        log.info("Cleaned up temporary files for run %s", stamp)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="GTA VI Shorts factory")
    parser.add_argument("--dry-run", action="store_true", help="render only; no upload, no state change")
    args = parser.parse_args(argv)

    setup_logging()
    log.info("=== Factory run started (dry_run=%s) ===", args.dry_run)

    try:
        config.require_settings("TWITCH_CLIENT_ID", "TWITCH_CLIENT_SECRET")
        with single_instance():
            purge_stale_files()
            return run_once(upload=not args.dry_run)
    except AlreadyRunningError:
        log.warning("Previous run is still active; exiting without doing anything.")
        return EXIT_ERROR
    except Exception:  # noqa: BLE001 - log everything; cron should see a non-zero exit
        log.exception("Factory run failed")
        return EXIT_ERROR
    finally:
        log.info("=== Factory run finished ===")


if __name__ == "__main__":
    sys.exit(main())
