"""
Offline smoke test for the video editor. No Twitch, Gemini or YouTube access needed.

It generates three synthetic 16:9 clips with ffmpeg, renders a Short, and checks the
result is 1080x1920, under 60 seconds, and has audio.

Run from the project folder:
    python tests/smoke_test_editor.py
"""

from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_DIR))

import config  # noqa: E402
import video_editor  # noqa: E402
from moviepy import VideoFileClip  # noqa: E402


def make_test_clip(path: Path, seconds: int, hue: str) -> None:
    """Make a 1280x720 test pattern with a sine tone so audio is exercised too."""
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "lavfi", "-i", f"testsrc2=size=1280x720:rate=30:duration={seconds}",
            "-f", "lavfi", "-i", f"sine=frequency=440:duration={seconds}",
            "-vf", f"hue=h={hue}",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest",
            str(path),
        ],
        check=True,
    )


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
        clips = []
        for i, hue in enumerate(["0", "120", "240"]):
            path = tmp_dir / f"clip{i}.mp4"
            make_test_clip(path, seconds=12, hue=hue)
            clips.append((path, f"test_creator_{i}"))

        out = tmp_dir / "short.mp4"
        video_editor.build_short(clips, hook="Smoke test hook", output_path=out)

        with VideoFileClip(str(out)) as result:
            assert (result.w, result.h) == (1080, 1920), f"bad size {result.w}x{result.h}"
            assert result.duration <= 60, f"too long: {result.duration:.1f}s"
            assert result.duration >= 30, f"too short: {result.duration:.1f}s"
            assert result.audio is not None, "output has no audio track"
            print(
                f"OK: {result.w}x{result.h}, {result.duration:.1f}s, "
                f"fps={result.fps}, audio=yes, font={config.FONT_PATH.name}"
            )


if __name__ == "__main__":
    main()
