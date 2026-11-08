"""
youtube_uploader.py

Uploads a finished Short with the YouTube Data API v3 (videos.insert).

Authentication uses OAuth 2.0 with a "Desktop app" client. An API key cannot upload,
because uploading writes to a channel and needs the user's permission.

One-time setup, on a machine with a web browser:
    python youtube_uploader.py --auth
This writes token.json. The server reuses it and refreshes it automatically.

Quota: videos.insert costs 1,600 units of the default 10,000 units per day, so the
default allows about six uploads a day. This pipeline makes one per run.
"""

from __future__ import annotations

import argparse
import logging
import os
import time
from pathlib import Path

from google.auth.exceptions import RefreshError
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

import config

log = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
UPLOAD_CHUNK_BYTES = 8 * 1024 * 1024
RETRIABLE_STATUS = {500, 502, 503, 504}
MAX_UPLOAD_RETRIES = 5
MAX_TAGS = 15


class UploadError(RuntimeError):
    """The upload could not be completed."""


def _save_token(creds: Credentials, token_file: Path) -> None:
    token_file.parent.mkdir(parents=True, exist_ok=True)
    token_file.write_text(creds.to_json(), encoding="utf-8")
    os.chmod(token_file, 0o600)  # the refresh token is a credential; keep it private


def get_credentials(interactive: bool = False) -> Credentials:
    """
    Load saved credentials, refreshing them if needed.

    If `interactive` is True and there is no usable token, opens a browser for the
    one-time Google login. On a headless server, interactive=False raises instead.
    """
    token_file = config.YOUTUBE_TOKEN_FILE
    creds: Credentials | None = None
    if token_file.exists():
        creds = Credentials.from_authorized_user_file(str(token_file), SCOPES)

    if creds and creds.valid:
        return creds

    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
        except RefreshError as exc:
            raise UploadError(
                "The YouTube refresh token was rejected. It was revoked, or the OAuth app "
                "has been in Testing mode for more than 7 days. Re-run: "
                "python youtube_uploader.py --auth"
            ) from exc
        _save_token(creds, token_file)
        return creds

    if not interactive:
        raise UploadError(f"No usable YouTube token at {token_file}. Run: python youtube_uploader.py --auth")

    if not config.YOUTUBE_CLIENT_SECRETS_FILE.exists():
        raise UploadError(
            f"OAuth client file not found at {config.YOUTUBE_CLIENT_SECRETS_FILE}. "
            "Download it from Google Cloud and save it under that name."
        )
    flow = InstalledAppFlow.from_client_secrets_file(str(config.YOUTUBE_CLIENT_SECRETS_FILE), SCOPES)
    # prompt=consent guarantees Google returns a refresh token, even on re-authorisation.
    creds = flow.run_local_server(port=0, access_type="offline", prompt="consent")
    _save_token(creds, token_file)
    log.info("Saved YouTube token to %s", token_file)
    return creds


def _resumable_upload(request) -> dict:
    """Drive a resumable upload to completion, retrying transient server errors."""
    response = None
    retries = 0
    while response is None:
        try:
            status, response = request.next_chunk()
            if status:
                log.info("Upload %d%% complete", int(status.progress() * 100))
        except HttpError as exc:
            if exc.resp.status in RETRIABLE_STATUS and retries < MAX_UPLOAD_RETRIES:
                retries += 1
                wait = 2**retries
                log.warning("YouTube returned %s; retrying chunk in %ss", exc.resp.status, wait)
                time.sleep(wait)
                continue
            raise UploadError(f"YouTube upload failed: {exc}") from exc
    return response


def upload_short(video_path: Path, title: str, description: str, hashtags: list[str]) -> str:
    """Upload the MP4 and return the new YouTube video ID."""
    if not video_path.exists():
        raise UploadError(f"Video file missing: {video_path}")

    creds = get_credentials(interactive=False)
    youtube = build("youtube", "v3", credentials=creds, cache_discovery=False)

    body = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": [tag.lstrip("#") for tag in hashtags][:MAX_TAGS],
            "categoryId": config.YOUTUBE_CATEGORY_ID,
        },
        "status": {
            "privacyStatus": config.YOUTUBE_PRIVACY_STATUS,
            # Required by YouTube. This is a general audience channel, not made for kids.
            "selfDeclaredMadeForKids": False,
        },
    }
    media = MediaFileUpload(
        str(video_path),
        mimetype="video/mp4",
        chunksize=UPLOAD_CHUNK_BYTES,
        resumable=True,
    )
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
    response = _resumable_upload(request)

    video_id = response["id"]
    log.info("Uploaded video %s (privacy: %s)", video_id, config.YOUTUBE_PRIVACY_STATUS)
    return video_id


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="YouTube uploader utilities")
    parser.add_argument("--auth", action="store_true", help="Run the one-time browser login")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    if args.auth:
        get_credentials(interactive=True)
        print(f"Token saved to {config.YOUTUBE_TOKEN_FILE}. Copy it to the server if you run there.")
    else:
        parser.print_help()
