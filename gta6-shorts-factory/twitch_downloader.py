"""
twitch_downloader.py

Finds the most-viewed GTA VI community clips from the last N hours and downloads
them to a local working folder.

Uses the official Twitch Helix API with the client-credentials ("app access") flow,
so no user login is needed. Only public clip metadata is requested.

Run it on its own to test the download step:
    python twitch_downloader.py
"""

from __future__ import annotations

import logging
import re
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests

import config

log = logging.getLogger(__name__)

TOKEN_URL = "https://id.twitch.tv/oauth2/token"
HELIX_URL = "https://api.twitch.tv/helix"
HTTP_TIMEOUT = 20
MAX_RETRIES = 4
MIN_VALID_MP4_BYTES = 10_000  # anything smaller is an error page, not a video
MAX_CANDIDATES = 100  # Helix returns at most 100 clips per request


class TwitchError(RuntimeError):
    """Something went wrong talking to Twitch or downloading a clip."""


@dataclass(frozen=True)
class Clip:
    id: str
    title: str
    url: str
    thumbnail_url: str
    broadcaster_name: str
    creator_name: str
    view_count: int
    duration: float
    created_at: str

    @property
    def media_url(self) -> str:
        """
        Direct MP4 URL for the clip.

        Twitch stores each clip's MP4 next to its preview image:
            .../SLUG-preview-480x272.jpg  ->  .../SLUG.mp4

        This URL pattern is not part of the documented API. It has been stable for
        years, but if downloads start failing, this is the one function to update.
        """
        base = re.sub(r"-preview-\d+x\d+\.(?:jpg|png)$", "", self.thumbnail_url)
        return f"{base}.mp4"


class TwitchClient:
    """Thin wrapper around the Helix endpoints we need."""

    def __init__(self, client_id: str, client_secret: str) -> None:
        self._client_id = client_id
        self._client_secret = client_secret
        self._token: str | None = None
        self._token_expiry = 0.0
        self._session = requests.Session()

    # -- auth -----------------------------------------------------------------
    def _access_token(self) -> str:
        """Return a cached app access token, requesting a new one when needed."""
        if self._token and time.time() < self._token_expiry - 60:
            return self._token

        resp = self._session.post(
            TOKEN_URL,
            data={
                "client_id": self._client_id,
                "client_secret": self._client_secret,
                "grant_type": "client_credentials",
            },
            timeout=HTTP_TIMEOUT,
        )
        resp.raise_for_status()
        payload = resp.json()
        self._token = payload["access_token"]
        self._token_expiry = time.time() + payload["expires_in"]
        return self._token

    # -- HTTP with retries ----------------------------------------------------
    def _get(self, endpoint: str, params: dict) -> dict:
        url = f"{HELIX_URL}/{endpoint}"
        resp: requests.Response | None = None

        for attempt in range(1, MAX_RETRIES + 1):
            headers = {
                "Client-Id": self._client_id,
                "Authorization": f"Bearer {self._access_token()}",
            }
            resp = self._session.get(url, headers=headers, params=params, timeout=HTTP_TIMEOUT)

            if resp.status_code == 401 and attempt < MAX_RETRIES:
                self._token = None  # token was invalidated early; fetch a fresh one
                continue
            if resp.status_code == 429 or resp.status_code >= 500:
                wait = 2**attempt
                log.warning("Twitch %s returned %s; retrying in %ss", endpoint, resp.status_code, wait)
                time.sleep(wait)
                continue

            resp.raise_for_status()
            return resp.json()

        if resp is not None and resp.status_code >= 400:
            resp.raise_for_status()
        raise TwitchError(f"Twitch {endpoint} failed after {MAX_RETRIES} attempts")

    # -- public API -----------------------------------------------------------
    def find_game_id(self, game_name: str) -> str:
        """Look up the Twitch category ID for a game by name."""
        data = self._get("search/categories", {"query": game_name, "first": 25})
        categories = data.get("data", [])
        wanted = game_name.strip().lower()

        for cat in categories:  # exact name first
            if cat["name"].strip().lower() == wanted:
                return cat["id"]
        for cat in categories:  # then a looser match, e.g. "GTA VI" vs the full title
            if "grand theft auto vi" in cat["name"].lower():
                return cat["id"]

        names = ", ".join(c["name"] for c in categories[:10]) or "no results"
        raise TwitchError(
            f"No Twitch category matched {game_name!r} ({names}). "
            "Set TWITCH_GAME_ID in .env to skip the lookup."
        )

    def fetch_candidate_clips(self, game_id: str, lookback_hours: int) -> list[Clip]:
        """Return up to 100 clips from the window, sorted by view count (highest first)."""
        end = datetime.now(timezone.utc)
        start = end - timedelta(hours=lookback_hours)
        params = {
            "game_id": game_id,
            "started_at": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "ended_at": end.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "first": MAX_CANDIDATES,
        }
        rows = self._get("clips", params).get("data", [])
        clips = [
            Clip(
                id=row["id"],
                title=row["title"],
                url=row["url"],
                thumbnail_url=row["thumbnail_url"],
                broadcaster_name=row["broadcaster_name"],
                creator_name=row["creator_name"],
                view_count=int(row["view_count"]),
                duration=float(row["duration"]),
                created_at=row["created_at"],
            )
            for row in rows
        ]
        clips.sort(key=lambda c: c.view_count, reverse=True)
        return clips

    def download(self, clip: Clip, dest_dir: Path) -> Path:
        """Stream a clip's MP4 to disk and return the local path."""
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest = dest_dir / f"{clip.id}.mp4"

        with self._session.get(clip.media_url, stream=True, timeout=60) as resp:
            resp.raise_for_status()
            with dest.open("wb") as fh:
                for chunk in resp.iter_content(chunk_size=256 * 1024):
                    fh.write(chunk)

        if dest.stat().st_size < MIN_VALID_MP4_BYTES:
            dest.unlink(missing_ok=True)
            raise TwitchError(f"Clip {clip.id} downloaded as a tiny file; probably not a video")
        return dest


def fetch_clips_for_short(
    used_ids: set[str],
    work_dir: Path,
    count: int,
    lookback_hours: int,
) -> list[tuple[Clip, Path]]:
    """
    Pick the top `count` clips that have not been used yet and download them.

    Clips that fail to download are skipped and the next most-viewed clip is tried,
    so one bad file does not sink the whole Short.
    """
    client = TwitchClient(config.TWITCH_CLIENT_ID, config.TWITCH_CLIENT_SECRET)
    game_id = config.TWITCH_GAME_ID or client.find_game_id(config.TWITCH_GAME_NAME)
    log.info("Searching Twitch game %s (id %s), last %sh", config.TWITCH_GAME_NAME, game_id, lookback_hours)

    candidates = client.fetch_candidate_clips(game_id, lookback_hours)
    fresh = [clip for clip in candidates if clip.id not in used_ids]
    log.info("Found %d clips, %d not yet used", len(candidates), len(fresh))

    results: list[tuple[Clip, Path]] = []
    for clip in fresh:
        if len(results) >= count:
            break
        try:
            path = client.download(clip, work_dir)
        except (requests.RequestException, TwitchError, OSError) as exc:
            log.warning("Skipping clip %s (%s): %s", clip.id, clip.title[:50], exc)
            continue
        log.info("Downloaded %s by @%s (%s views)", clip.id, clip.creator_name, f"{clip.view_count:,}")
        results.append((clip, path))

    if len(results) < count:
        log.warning("Only %d of %d requested clips could be downloaded", len(results), count)
    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    config.require_settings("TWITCH_CLIENT_ID", "TWITCH_CLIENT_SECRET")
    found = fetch_clips_for_short(
        used_ids=set(),
        work_dir=config.WORK_DIR / "test-download",
        count=config.CLIPS_PER_SHORT,
        lookback_hours=config.TWITCH_LOOKBACK_HOURS,
    )
    for clip, path in found:
        print(f"{path}  |  {clip.title}  |  {clip.view_count:,} views")
