# GTA VI Shorts Factory

An automated pipeline that finds the most-viewed GTA VI community clips on Twitch, edits them into a vertical 1080x1920 YouTube Short, writes the title and hashtags with Gemini, and uploads it with the YouTube Data API v3. It runs once a day from cron and cleans up after itself.

```text
Twitch Helix API ──► twitch_downloader.py ──► metadata_agent.py (Gemini)
                                                     │
                                                     ▼
                       youtube_uploader.py ◄── video_editor.py (MoviePy, 9:16)
                                                     ▲
                                  main.py (orchestration, state, cleanup, cron)
```

## Read in this order

1. [`docs/PART1_ACCOUNT_SETUP.md`](docs/PART1_ACCOUNT_SETUP.md): Google Cloud, YouTube OAuth, Twitch app, Gemini key, and the `.env` file.
2. [`docs/PART2_INFRASTRUCTURE.md`](docs/PART2_INFRASTRUCTURE.md): VPS setup, ffmpeg, Python environment, first runs, and cron.

## Files

| File | Purpose |
|---|---|
| `config.py` | Loads every setting from `.env`. No secrets in code. |
| `twitch_downloader.py` | Finds the top clips from the last 24 hours and downloads them. |
| `video_editor.py` | MoviePy 2 render: blurred 9:16 background, centred clip, hook, credits, progress bar. |
| `metadata_agent.py` | Gemini Flash writes the title, hook, description, and hashtags. Template fallback if the API fails. |
| `youtube_uploader.py` | OAuth refresh, resumable upload, retries on transient errors. `--auth` for the one-time login. |
| `main.py` | Runs the loop: skips used clips, cleans up temporary files, and uses a lock so runs never overlap. |
| `tests/smoke_test_editor.py` | Offline render test on synthetic clips. No API keys needed. |
| `deploy/crontab.example` | Daily schedule line. |

## Quick start

```bash
cd gta6-shorts-factory
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt          # ffmpeg must also be installed system-wide
cp .env.example .env                     # then fill in your keys (Part 1)
python tests/smoke_test_editor.py        # offline render check
python youtube_uploader.py --auth        # one-time YouTube login (needs a browser)
python main.py --dry-run                 # full run, renders only
python main.py                           # full run, uploads a private Short
```

## Design decisions

- **Twitch for sourcing, not YouTube search.** The YouTube search endpoint costs 100 units per call, against a 10,000-unit daily quota. Clips come from Twitch's free API instead, sorted by view count.
- **Gemini with a template fallback.** Titles are the only part that needs judgement. If Gemini is down, the pipeline still ships an accurate, plainer title.
- **Clips are marked used only after a successful upload.** A failed render or upload means the clips are picked up again the next day.
- **Private by default.** Unaudited YouTube API projects are forced to private anyway. `YOUTUBE_PRIVACY_STATUS` defaults to `private` so you review the first batch.
- **The metadata prompt forbids invented claims.** Clickbait is allowed. Misleading titles get viewer complaints and channel penalties.

Read Part 2, section 12 before you schedule public uploads. It covers clip creator rights, Rockstar's policies, and YouTube's reused-content rules.
