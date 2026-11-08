"""
Central configuration for the GTA VI Shorts factory.

Every setting is read from environment variables, or from a `.env` file that sits
next to this module (see `.env.example`). Secrets never live in the code.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


class ConfigError(RuntimeError):
    """A required setting is missing or has an invalid value."""


def _str(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name)
    if value is None or not value.strip():
        return default
    return value.strip()


def _int(name: str, default: int) -> int:
    raw = _str(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError as exc:
        raise ConfigError(f"{name} must be a whole number, got {raw!r}") from exc


def _bool(name: str, default: bool) -> bool:
    raw = _str(name)
    if raw is None:
        return default
    return raw.lower() in {"1", "true", "yes", "on"}


def _path(name: str, default: str) -> Path:
    """Relative paths are resolved against the project folder, absolute paths are kept."""
    return (BASE_DIR / (_str(name) or default)).resolve()


# --- Twitch (Helix API, app access) -----------------------------------------
TWITCH_CLIENT_ID = _str("TWITCH_CLIENT_ID")
TWITCH_CLIENT_SECRET = _str("TWITCH_CLIENT_SECRET")
TWITCH_GAME_NAME = _str("TWITCH_GAME_NAME", "Grand Theft Auto VI")
TWITCH_GAME_ID = _str("TWITCH_GAME_ID")  # optional: skips the category lookup
TWITCH_LOOKBACK_HOURS = _int("TWITCH_LOOKBACK_HOURS", 24)

# --- Short composition --------------------------------------------------------
CLIPS_PER_SHORT = _int("CLIPS_PER_SHORT", 5)
# Shorts can be up to 3 minutes now, but a sub-60s Short is the safe, proven format.
MAX_SHORT_SECONDS = _int("MAX_SHORT_SECONDS", 58)
FONT_PATH = _path("FONT_PATH", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
RENDER_PRESET = _str("RENDER_PRESET", "veryfast")  # x264 speed/size trade-off
RENDER_THREADS = _int("RENDER_THREADS", 2)

# --- Gemini (metadata) --------------------------------------------------------
GEMINI_API_KEY = _str("GEMINI_API_KEY")
GEMINI_MODEL = _str("GEMINI_MODEL", "gemini-2.5-flash")

# --- YouTube Data API v3 (uploads) -------------------------------------------
YOUTUBE_CLIENT_SECRETS_FILE = _path("YOUTUBE_CLIENT_SECRETS_FILE", "client_secret.json")
YOUTUBE_TOKEN_FILE = _path("YOUTUBE_TOKEN_FILE", "token.json")
YOUTUBE_PRIVACY_STATUS = (_str("YOUTUBE_PRIVACY_STATUS", "private") or "private").lower()
YOUTUBE_CATEGORY_ID = _str("YOUTUBE_CATEGORY_ID", "20")  # 20 = Gaming

# --- Local folders and housekeeping ------------------------------------------
WORK_DIR = _path("WORK_DIR", "work")  # downloaded clips, deleted after each run
OUTPUT_DIR = _path("OUTPUT_DIR", "output")  # rendered Shorts
STATE_DIR = _path("STATE_DIR", "state")  # used-clip history + lock file
LOG_DIR = _path("LOG_DIR", "logs")
KEEP_OUTPUT = _bool("KEEP_OUTPUT", False)  # keep rendered MP4s after upload

DISCLAIMER = (
    "Unofficial fan compilation. Not affiliated with Rockstar Games or Take-Two Interactive."
)

_VALID_PRIVACY = {"private", "unlisted", "public"}
if YOUTUBE_PRIVACY_STATUS not in _VALID_PRIVACY:
    raise ConfigError(
        f"YOUTUBE_PRIVACY_STATUS must be one of {sorted(_VALID_PRIVACY)}, "
        f"got {YOUTUBE_PRIVACY_STATUS!r}"
    )


def require_settings(*names: str) -> None:
    """Fail fast with a readable message if any named setting is empty."""
    missing = [name for name in names if not globals().get(name)]
    if missing:
        raise ConfigError(
            "Missing settings: "
            + ", ".join(missing)
            + ". Add them to .env (see .env.example)."
        )
