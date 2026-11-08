"""
video_editor.py

Turns several 16:9 Twitch clips into one 1080x1920 vertical Short with MoviePy 2.x.

Layout, per frame:
  * Background: the same clip scaled to fill the frame, blurred and dimmed.
  * Foreground: the original clip, fitted to full width and centred vertically.
  * Hook text: a headline across the top for the first few seconds.
  * Credit line: "@creator  2/5" above the progress bar, changes for every clip.
  * Progress bar: a thin bar along the bottom that fills across the whole Short.

Clips play back-to-back in the order given. Each one is trimmed so the total length
stays within config.MAX_SHORT_SECONDS.
"""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
from moviepy import CompositeVideoClip, TextClip, VideoClip, VideoFileClip, concatenate_videoclips
from moviepy.video.fx import FadeIn, FadeOut
from PIL import Image, ImageFilter

import config

log = logging.getLogger(__name__)

OUT_W, OUT_H = 1080, 1920
FPS = 30
HOOK_SECONDS = 3.0
MIN_SEGMENT_SECONDS = 3.0
MIN_TOTAL_SECONDS = 15.0

BAR_HEIGHT = 14
BAR_BOTTOM_MARGIN = 60
ACCENT_RGB = np.array([255, 196, 0], dtype=np.uint8)
TRACK_RGB = np.array([60, 60, 60], dtype=np.uint8)


class EditError(RuntimeError):
    """The Short could not be built from the given clips."""


def _even(value: int) -> int:
    """libx264 with yuv420p needs even dimensions."""
    return value if value % 2 == 0 else value - 1


def _blurred_background(src: VideoFileClip) -> VideoClip:
    """Fill the 9:16 frame with the clip, then blur and dim it heavily."""
    filled = src.resized(height=OUT_H)
    filled = filled.cropped(x_center=filled.w / 2, width=OUT_W)

    def blur_and_dim(frame: np.ndarray) -> np.ndarray:
        # Blurring a tiny copy and scaling it back up is much faster than blurring
        # 1080x1920 frames directly, and the result looks the same for a background.
        small = Image.fromarray(frame).resize((OUT_W // 12, OUT_H // 12), Image.BILINEAR)
        small = small.filter(ImageFilter.GaussianBlur(radius=4))
        big = np.asarray(small.resize((OUT_W, OUT_H), Image.BILINEAR), dtype=np.float32)
        return (big * 0.45).astype(np.uint8)

    return filled.image_transform(blur_and_dim).without_audio()


def _foreground(src: VideoFileClip) -> VideoClip:
    """Scale the original clip to fit the frame without cropping, centred."""
    scale = min(OUT_W / src.w, OUT_H / src.h)
    width, height = _even(round(src.w * scale)), _even(round(src.h * scale))
    return src.resized(new_size=(width, height)).with_position(("center", "center"))


def _text(text: str, font_size: int, **kwargs) -> TextClip:
    return TextClip(
        font=str(config.FONT_PATH),
        text=text,
        font_size=font_size,
        color="white",
        stroke_color="black",
        stroke_width=max(3, font_size // 12),
        **kwargs,
    )


def _progress_bar(offset: float, total: float, duration: float) -> VideoClip:
    """A bar that fills from left to right over the full length of the Short."""
    y = OUT_H - BAR_BOTTOM_MARGIN - BAR_HEIGHT

    def make_frame(t: float) -> np.ndarray:
        progress = min(max((offset + t) / total, 0.0), 1.0)
        frame = np.empty((BAR_HEIGHT, OUT_W, 3), dtype=np.uint8)
        frame[:] = TRACK_RGB
        frame[:, : int(OUT_W * progress)] = ACCENT_RGB
        return frame

    return VideoClip(make_frame, duration=duration).with_position((0, y))


def _build_segment(
    src: VideoFileClip,
    seg_len: float,
    index: int,
    count: int,
    offset: float,
    total: float,
    creator: str,
    hook: str | None,
) -> CompositeVideoClip:
    """Compose one clip's worth of the Short: background, foreground, text and bar."""
    body = src.subclipped(0, seg_len)
    layers = [_blurred_background(body), _foreground(body)]

    credit_y = OUT_H - BAR_BOTTOM_MARGIN - BAR_HEIGHT - 110
    credit = _text(f"@{creator}   {index + 1}/{count}", 46, method="label", duration=seg_len)
    layers.append(credit.with_position((60, credit_y)))

    if hook:
        headline = _text(
            hook.upper(),
            84,
            method="caption",
            size=(OUT_W - 120, None),
            text_align="center",
            duration=min(HOOK_SECONDS, seg_len),
        )
        layers.append(headline.with_position(("center", 180)).with_effects([FadeOut(0.5)]))

    layers.append(_progress_bar(offset, total, seg_len))

    segment = CompositeVideoClip(layers, size=(OUT_W, OUT_H)).with_duration(seg_len)
    if body.audio is not None:
        # Audio comes only from the original clip, never from the background copy.
        segment = segment.with_audio(body.audio)
    return segment.with_effects([FadeIn(0.25)])


def _verify_output(path: Path) -> None:
    """Re-open the rendered file and make sure it is the format YouTube expects."""
    with VideoFileClip(str(path)) as check:
        if (check.w, check.h) != (OUT_W, OUT_H):
            raise EditError(f"Rendered size {check.w}x{check.h}, expected {OUT_W}x{OUT_H}")
        if check.duration > 180:
            raise EditError(f"Rendered {check.duration:.0f}s, longer than the 3-minute Shorts limit")


def build_short(clips: list[tuple[Path, str]], hook: str, output_path: Path) -> Path:
    """
    Render a vertical Short.

    Args:
        clips: (video_path, creator_name) pairs, in playback order.
        hook: short headline shown over the first few seconds.
        output_path: where to write the MP4.

    Returns:
        The output path.
    """
    if not config.FONT_PATH.exists():
        raise EditError(
            f"Font not found at {config.FONT_PATH}. Install fonts-dejavu-core "
            "or set FONT_PATH in .env."
        )
    if not clips:
        raise EditError("No clips were provided")

    per_clip_limit = config.MAX_SHORT_SECONDS / len(clips)
    sources: list[VideoFileClip] = []
    segments: list[CompositeVideoClip] = []
    final = None

    try:
        sources = [VideoFileClip(str(path)) for path, _ in clips]
        lengths = [min(src.duration, per_clip_limit) for src in sources]

        usable = [i for i, length in enumerate(lengths) if length >= MIN_SEGMENT_SECONDS]
        if not usable:
            raise EditError("Every clip is shorter than the minimum segment length")

        total = sum(lengths[i] for i in usable)
        if total < MIN_TOTAL_SECONDS:
            raise EditError(f"Only {total:.0f}s of usable footage; need at least {MIN_TOTAL_SECONDS:.0f}s")

        offset = 0.0
        for position, i in enumerate(usable):
            _, creator = clips[i]
            segment = _build_segment(
                src=sources[i],
                seg_len=lengths[i],
                index=position,
                count=len(usable),
                offset=offset,
                total=total,
                creator=creator,
                hook=hook if position == 0 else None,
            )
            segments.append(segment)
            offset += lengths[i]

        final = concatenate_videoclips(segments, method="chain")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        log.info("Rendering %.1fs Short from %d clips to %s", total, len(usable), output_path.name)

        final.write_videofile(
            str(output_path),
            fps=FPS,
            codec="libx264",
            audio_codec="aac",
            bitrate="6000k",
            preset=config.RENDER_PRESET,
            threads=config.RENDER_THREADS,
            ffmpeg_params=["-pix_fmt", "yuv420p", "-movflags", "+faststart"],
            # MoviePy writes its temporary audio track next to the output by default
            # (the project folder when run from there). Keep it beside the output instead.
            temp_audiofile_path=str(output_path.parent),
            logger=None,  # keeps cron logs readable; the log lines above say what happened
        )
    finally:
        if final is not None:
            final.close()
        for segment in segments:
            segment.close()
        for src in sources:
            src.close()

    _verify_output(output_path)
    log.info("Rendered %s", output_path)
    return output_path
