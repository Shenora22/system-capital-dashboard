#!/usr/bin/env python3
"""
assemble_short.py

Builds one vertical 1080x1920 Short from one or more clips you have permission to
use, using FFmpeg directly (subprocess, no extra Python packages).

Layout, back to front:
  * Background: the first clip scaled to fill the frame, blurred and dimmed.
  * Main window: each clip fitted to the width, centred, with a thin white border.
  * Hook card: title text across the top for the first HOOK_SECONDS of the video.
  * Commentary callouts: timed text notes on the right, set with --callout.
  * Lower third: a dark band with the channel name and a credit line for each clip.

Clips are joined with a short cross-fade. Video and audio use the same fade and
the same trim lengths, so the streams stay in sync.

Example:
    python tools/assemble_short.py \
        --input clip_a.mp4 clip_b.mp4 \
        --creators alice bob \
        --output short.mp4 \
        --hook_text "He actually did it" \
        --channel "My Channel" \
        --callout "2-6:Watch the timing" \
        --callout "8-12:The key move"

Credit the creators you use, and only publish clips you are allowed to use.
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import shutil
import subprocess
import sys
import tempfile
import textwrap
from dataclasses import dataclass
from pathlib import Path

log = logging.getLogger("assemble_short")

W, H = 1080, 1920
FPS = 30
FADE = 0.4  # seconds of cross-fade between clips
HOOK_SECONDS = 3.0
LOWER_THIRD_H = 300
MIN_CLIP_SECONDS = 2 * FADE + 0.5  # a clip must be longer than its two fades
MAX_SECONDS_DEFAULT = 58

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",  # Linux
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",  # macOS
]

CALLOUT_RE = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*:\s*(.+?)\s*$")


@dataclass
class Clip:
    path: Path
    seg: float  # seconds of this clip used in the Short
    has_audio: bool
    credit: str


@dataclass
class Callout:
    start: float
    end: float
    text: str


def quote(value: str) -> str:
    """Quote a value for a filtergraph option. Apostrophes cannot be escaped here."""
    if "'" in value:
        raise ValueError(f"Cannot pass a value containing an apostrophe to FFmpeg: {value}")
    return f"'{value}'"


def write_text(workdir: Path, name: str, text: str) -> Path:
    """Put on-screen text in a file, so drawtext never sees special characters."""
    path = workdir / name
    path.write_text(text, encoding="utf-8")
    return path


def probe(path: Path) -> tuple[float, bool]:
    """Return (duration in seconds, has an audio stream). Raises if there is no video."""
    cmd = [
        "ffprobe", "-v", "error", "-print_format", "json",
        "-show_entries", "format=duration:stream=codec_type",
        str(path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    data = json.loads(result.stdout)
    streams = data.get("streams", [])
    if not any(s.get("codec_type") == "video" for s in streams):
        raise ValueError(f"{path.name} has no video stream")
    duration = float(data["format"]["duration"])
    has_audio = any(s.get("codec_type") == "audio" for s in streams)
    return duration, has_audio


def resolve_font(explicit: str | None) -> str:
    for candidate in [explicit] if explicit else FONT_CANDIDATES:
        if candidate and Path(candidate).exists():
            return candidate
    raise SystemExit("No font found. Install DejaVu fonts or pass --font PATH.")


def plan_clips(paths: list[Path], creators: list[str] | None, max_seconds: float) -> list[Clip]:
    """Work out how much of each clip to use so the whole Short fits in max_seconds."""
    per_clip = max_seconds / len(paths)
    clips: list[Clip] = []
    for i, path in enumerate(paths):
        length, has_audio = probe(path)
        seg = min(length, per_clip)
        if seg < MIN_CLIP_SECONDS:
            log.warning("Skipping %s: %.1fs is too short to use", path.name, seg)
            continue
        credit = creators[i] if creators and i < len(creators) else path.stem
        clips.append(Clip(path=path, seg=seg, has_audio=has_audio, credit=credit.lstrip("@")))
    if not clips:
        raise SystemExit("No usable clips after checking durations.")
    return clips


def total_length(clips: list[Clip]) -> float:
    return sum(c.seg for c in clips) - FADE * (len(clips) - 1)


def build_filtergraph(
    clips: list[Clip],
    hook: str,
    channel: str,
    callouts: list[Callout],
    font: str,
    workdir: Path,
) -> str:
    lines: list[str] = []
    n = len(clips)

    # 1. Build each clip as a 1080x1920 segment with matching audio.
    for i, c in enumerate(clips):
        lines.append(
            f"[{i}:v]trim=0:{c.seg:.3f},setpts=PTS-STARTPTS,fps={FPS},format=yuv420p,"
            f"split=2[bgsrc{i}][fgsrc{i}]"
        )
        lines.append(
            f"[bgsrc{i}]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
            f"boxblur=luma_radius=40:luma_power=2,eq=brightness=-0.15:saturation=0.8[bg{i}]"
        )
        lines.append(f"[fgsrc{i}]scale={W - 80}:-2,pad=iw+8:ih+8:4:4:color=white@0.85[fg{i}]")
        lines.append(f"[bg{i}][fg{i}]overlay=(W-w)/2:(H-h)/2,setsar=1[seg{i}]")
        if c.has_audio:
            lines.append(
                f"[{i}:a]atrim=0:{c.seg:.3f},asetpts=PTS-STARTPTS,"
                f"aformat=sample_rates=48000:channel_layouts=stereo[a{i}]"
            )
        else:
            lines.append(
                f"anullsrc=channel_layout=stereo:sample_rate=48000,"
                f"atrim=0:{c.seg:.3f},asetpts=PTS-STARTPTS[a{i}]"
            )

    # 2. Join segments with video and audio cross-fades, using the same offsets.
    video_label, audio_label = "seg0", "a0"
    starts = [0.0]
    for i in range(1, n):
        offset = sum(c.seg for c in clips[:i]) - i * FADE
        lines.append(
            f"[{video_label}][seg{i}]xfade=transition=fade:duration={FADE}:offset={offset:.3f}[vx{i}]"
        )
        lines.append(f"[{audio_label}][a{i}]acrossfade=d={FADE}[ax{i}]")
        video_label, audio_label = f"vx{i}", f"ax{i}"
        starts.append(offset)
    lines.append(f"[{audio_label}]anull[abase]")

    # 3. Text and graphics on the joined video, placed on the global timeline.
    total = total_length(clips)
    font_arg = f"fontfile={quote(font)}"
    overlays = [
        f"drawbox=x=0:y=ih-{LOWER_THIRD_H}:w=iw:h={LOWER_THIRD_H}:color=black@0.65:t=fill"
    ]

    if channel:
        brand = write_text(workdir, "brand.txt", channel)
        overlays.append(
            f"drawtext={font_arg}:textfile={quote(str(brand))}:fontcolor=white:fontsize=58:"
            f"x=60:y=h-{LOWER_THIRD_H - 30}:shadowcolor=black@0.6:shadowx=2:shadowy=2"
        )

    for i, c in enumerate(clips):
        end = starts[i + 1] if i + 1 < n else total
        credit = write_text(workdir, f"credit{i}.txt", f"Clip by @{c.credit}")
        overlays.append(
            f"drawtext={font_arg}:textfile={quote(str(credit))}:fontcolor=0xDDDDDD:fontsize=42:"
            f"x=60:y=h-{LOWER_THIRD_H - 110}:"
            f"enable='between(t,{starts[i]:.3f},{end:.3f})'"
        )

    if hook:
        hook_file = write_text(workdir, "hook.txt", textwrap.fill(hook, width=18))
        fade_in, fade_out_start = 0.25, HOOK_SECONDS - 0.4
        alpha = (
            f"if(lt(t,{fade_in}),t/{fade_in},"
            f"if(lt(t,{fade_out_start}),1,({HOOK_SECONDS}-t)/0.4))"
        )
        overlays.append(
            f"drawtext={font_arg}:textfile={quote(str(hook_file))}:fontcolor=white:fontsize=96:"
            f"bordercolor=black:borderw=7:x=(w-text_w)/2:y=200:"
            f"alpha='{alpha}':enable='between(t,0,{HOOK_SECONDS})'"
        )

    for k, co in enumerate(callouts):
        co_file = write_text(workdir, f"callout{k}.txt", textwrap.fill(co.text, width=22))
        overlays.append(
            f"drawtext={font_arg}:textfile={quote(str(co_file))}:fontcolor=white:fontsize=50:"
            f"box=1:boxcolor=black@0.55:boxborderw=18:x=w-text_w-60:y=560:"
            f"enable='between(t,{co.start:.3f},{co.end:.3f})'"
        )

    lines.append(f"[{video_label}]" + ",".join(overlays) + "[vout]")
    return ";".join(lines)


def build_command(clips: list[Clip], filtergraph: str, output: Path) -> list[str]:
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
    for c in clips:
        cmd += ["-i", str(c.path)]
    cmd += [
        "-filter_complex", filtergraph,
        "-map", "[vout]",
        "-map", "[abase]",
        "-t", f"{total_length(clips):.3f}",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-pix_fmt", "yuv420p", "-r", str(FPS),
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-movflags", "+faststart",
        str(output),
    ]
    return cmd


def parse_callouts(raw: list[str]) -> list[Callout]:
    callouts: list[Callout] = []
    for item in raw:
        match = CALLOUT_RE.match(item)
        if not match:
            raise SystemExit(f"Bad --callout {item!r}. Use the form START-END:TEXT, e.g. 2-6:Note")
        start, end, text = float(match.group(1)), float(match.group(2)), match.group(3)
        if end <= start:
            raise SystemExit(f"Callout end must be after start: {item!r}")
        callouts.append(Callout(start=start, end=end, text=text))
    return callouts


def check_tools() -> None:
    missing = [tool for tool in ("ffmpeg", "ffprobe") if shutil.which(tool) is None]
    if missing:
        raise SystemExit(f"Missing required tools: {', '.join(missing)}. Install FFmpeg first.")


def parse_args(argv: list[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Assemble clips into a 1080x1920 vertical Short.")
    parser.add_argument("--input", nargs="+", required=True, help="one or more source clips, in order")
    parser.add_argument("--output", required=True, help="output MP4 path")
    parser.add_argument("--hook_text", default="", help="title shown over the first 3 seconds")
    parser.add_argument("--channel", default="", help="channel name for the lower-third card")
    parser.add_argument("--creators", nargs="+", help="creator name for each input, in the same order")
    parser.add_argument(
        "--callout", action="append", default=[],
        help='timed commentary text, "START-END:TEXT" in seconds, e.g. "2-6:Watch the timing". Repeatable.',
    )
    parser.add_argument("--font", help="path to a .ttf font file")
    parser.add_argument("--max_seconds", type=float, default=MAX_SECONDS_DEFAULT,
                        help="maximum total length of the Short")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    check_tools()

    inputs = [Path(p).expanduser().resolve() for p in args.input]
    for path in inputs:
        if not path.exists():
            raise SystemExit(f"Input not found: {path}")
    if args.creators and len(args.creators) != len(inputs):
        raise SystemExit("--creators must have one name per --input.")

    font = resolve_font(args.font)
    callouts = parse_callouts(args.callout)
    clips = plan_clips(inputs, args.creators, args.max_seconds)
    output = Path(args.output).expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)

    workdir = Path(tempfile.mkdtemp(prefix="assemble_short_"))
    try:
        filtergraph = build_filtergraph(clips, args.hook_text, args.channel, callouts, font, workdir)
        cmd = build_command(clips, filtergraph, output)
        log.info("Rendering %.1fs from %d clip(s) to %s", total_length(clips), len(clips), output)
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as exc:
        log.error("FFmpeg failed with exit code %s", exc.returncode)
        return 1
    finally:
        shutil.rmtree(workdir, ignore_errors=True)

    log.info("Done: %s", output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
