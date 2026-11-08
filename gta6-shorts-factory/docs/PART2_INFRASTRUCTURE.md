# Part 2: Infrastructure setup

This part gets the factory running on a cheap Linux VPS, or on your own machine for testing. Do Part 1 first, so `.env`, `client_secret.json`, and `token.json` exist.

---

## 1. Choose where it runs

| Option | Cost | Good for |
|---|---|---|
| Local machine (Linux, macOS, or Windows with WSL) | Free | Testing, and a Mac or PC that stays on at the scheduled time |
| VPS, 1 vCPU, 1 GB RAM, 25 GB disk, Ubuntu 24.04 LTS | About $4 to $6 per month | Unattended daily runs |

Pick any reputable VPS provider. Rendering is the heaviest step. A 1 GB machine works, but add swap (step 2.3). If renders are slow, move to a 2 GB plan. Expect rendering a 1-minute 1080x1920 Short to take minutes, not seconds, on a single shared vCPU. Measure it on your server before you schedule anything.

Your VPS does not need a desktop, a GPU, or ImageMagick. MoviePy 2 draws text with Pillow.

---

## 2. Server setup (Ubuntu 24.04)

Commands below are for Ubuntu. For a local Mac or Windows machine, see section 4.

### 2.1 Connect and update

```bash
ssh root@YOUR_SERVER_IP          # or your provider's console
apt update && apt upgrade -y
```

Create a non-root user for the factory (recommended):

```bash
adduser factory                  # set a password when asked
usermod -aG sudo factory
su - factory
```

### 2.2 Install system packages

```bash
sudo apt install -y ffmpeg python3-venv python3-pip git fonts-dejavu-core
ffmpeg -version | head -1
```

Why each one:
- **ffmpeg**: MoviePy hands every decode and encode job to ffmpeg. The binary must be on the system PATH. It also provides `ffprobe`.
- **python3-venv**: keeps this project's Python packages separate from the system's.
- **fonts-dejavu-core**: provides `DejaVuSans-Bold.ttf`, the default font path in `.env.example`. Without a font, text overlays fail.
- **git**: lets you pull updates.

### 2.3 Add swap (for 1 GB servers)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h                          # Swap should show 2.0G
```

### 2.4 Set the server timezone

Cron uses the server clock. To run at 6 PM in New York:

```bash
sudo timedatectl set-timezone America/New_York
date
```

---

## 3. File structure

After everything is set up, the server should look like this:

```text
/opt/gta6-shorts-factory/
├── .venv/                   # Python virtual environment (created in 2.5)
├── .env                     # secrets (chmod 600)
├── client_secret.json       # Google OAuth client (chmod 600)
├── token.json               # YouTube refresh token (chmod 600)
├── config.py                # settings loaded from .env
├── twitch_downloader.py     # step 1: find and download clips
├── metadata_agent.py        # step 3: Gemini titles, hooks, hashtags
├── video_editor.py          # step 4: MoviePy render to 1080x1920
├── youtube_uploader.py      # step 5: upload via YouTube Data API v3
├── main.py                  # orchestration, cleanup, exit codes
├── requirements.txt
├── .env.example
├── deploy/crontab.example
├── tests/smoke_test_editor.py
├── docs/
├── work/                    # temporary downloads (auto-cleaned)
├── output/                  # rendered Shorts (deleted after upload)
├── state/                   # used-clip history and lock file
└── logs/                    # factory.log (rotating), cron.out
```

`work/`, `output/`, `state/`, and `logs/` are created automatically on first use.

---

## 4. Create the project on your machine or server

### 4.1 Get the code

The code lives in a folder of the `system-capital-dashboard` repository. Clone only that folder:

```bash
sudo mkdir -p /opt/gta6-shorts-factory && sudo chown $USER /opt/gta6-shorts-factory
cd /opt
git clone --filter=blob:none --sparse https://github.com/Shenora22/system-capital-dashboard.git gta6-clone
cd gta6-clone
git sparse-checkout set gta6-shorts-factory
git checkout claude/gta6-shorts-factory-8pg5q8
cp -r gta6-shorts-factory/. /opt/gta6-shorts-factory/
cd /opt/gta6-shorts-factory
```

Alternatively, copy the folder with `scp -r gta6-shorts-factory YOUR_USER@YOUR_SERVER_IP:/opt/`.

To update later, repeat `git pull` in the clone and copy the files over again.

### 4.2 (Local machine only) Install ffmpeg

- **macOS (Homebrew):** `brew install ffmpeg`
- **Windows:** run WSL, then follow the Ubuntu steps above. Native Windows also works with `winget install Gyan.FFmpeg`, but WSL is simpler for cron-style scheduling.
- **Other Linux:** install `ffmpeg` and `fonts-dejavu-core` (or any `.ttf` font) with your package manager.

---

## 5. Python environment and requirements

```bash
cd /opt/gta6-shorts-factory
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

The install takes a few minutes. It pulls in MoviePy, which brings NumPy and Pillow with it. `streamlink` is also installed, as requested, though the downloader does not need it.

Check that the key pieces import and that ffmpeg is visible:

```bash
python -c "import moviepy, google.auth, googleapiclient, requests, dotenv; print('imports ok, moviepy', moviepy.__version__)"
python -c "import imageio_ffmpeg; print('ffmpeg:', imageio_ffmpeg.get_ffmpeg_exe())"
```

MoviePy uses the system ffmpeg when it can find it, and falls back to the copy bundled through `imageio-ffmpeg`. Either works. Installing system ffmpeg in step 2.2 gives you `ffprobe` and a version you control.

---

## 6. Configuration

```bash
cp .env.example .env
nano .env                        # paste your real values from Part 1
chmod 600 .env
```

Confirm the settings load without printing them:

```bash
python -c "import config; config.require_settings('TWITCH_CLIENT_ID','TWITCH_CLIENT_SECRET'); print('settings ok, privacy =', config.YOUTUBE_PRIVACY_STATUS)"
```

---

## 7. Test the rendering engine (offline, no API keys needed)

```bash
python tests/smoke_test_editor.py
```

This creates three fake 12-second clips, renders a Short, and checks the output. You should see a line like:

```text
OK: 1080x1920, 35.9s, fps=30.0, audio=yes, font=DejaVuSans-Bold.ttf
```

If it fails, read section 11 (troubleshooting) before going further.

---

## 8. Put the credentials on the server

Choose one of these ways to get `client_secret.json` and `token.json` onto the server. Run them from your own computer:

```bash
scp client_secret.json token.json YOUR_USER@YOUR_SERVER_IP:/opt/gta6-shorts-factory/
ssh YOUR_USER@YOUR_SERVER_IP "chmod 600 /opt/gta6-shorts-factory/{client_secret.json,token.json,.env}"
```

Never commit these three files. Never send them through chat.

Because `token.json` was created on your computer in Part 1 step 1.8, the server can refresh it on its own. You never need a browser on the server.

---

## 9. First runs

### 9.1 Dry run (renders, does not upload)

```bash
source .venv/bin/activate
python main.py --dry-run
```

What to expect:
1. Logs saying how many GTA VI clips were found and how many were new.
2. Downloads of up to five MP4 files into `work/`.
3. A generated title and hook.
4. A render into `output/`. Dry-run renders are kept so you can watch them.
5. "Cleaned up temporary files", and the downloads are gone from `work/`.

Open the file in `output/` and check the framing, the hook text, and the audio. Copy it to your computer with `scp` if you want to watch it locally.

If Twitch returns no clips, that can be normal before GTA VI is live. Exit code 2 means "not enough fresh clips", and nothing was produced. Try again later.

### 9.2 Real run (uploads as private)

```bash
python main.py
```

Check the output for a line with `Published https://youtube.com/shorts/...`. The video is private, so open YouTube Studio and review it. The clip IDs are then recorded in `state/state.json`, so they will not be used again.

### 9.3 Confirm the exit code

```bash
python main.py --dry-run; echo "exit code: $?"
```

Exit codes: `0` success, `1` error (see `logs/factory.log`), `2` not enough clips today.

---

## 10. Schedule it with cron

Open the crontab for the factory user:

```bash
crontab -e
```

Add the line from `deploy/crontab.example`, adjusting the path if you used a different folder:

```cron
0 18 * * * cd /opt/gta6-shorts-factory && /opt/gta6-shorts-factory/.venv/bin/python main.py >> logs/cron.out 2>&1
```

Save and exit. Then check that it is installed:

```bash
crontab -l
```

Notes:
- Cron runs with a minimal environment. The script loads everything it needs from `.env`, using absolute paths, so this is fine.
- The lock file in `state/` stops two runs from overlapping if one is slow.
- Check the schedule with `grep CRON /var/log/syslog` on Ubuntu, or with `journalctl -u cron`.
- Read the results in `logs/factory.log`. Use `tail -n 100 logs/factory.log` to see the last run.

To pause the factory without deleting anything, comment out the cron line with `#`.

---

## 11. Maintenance and troubleshooting

### Routine checks (weekly)

- `df -h /` (disk). The factory deletes its temporary files, so it should stay small.
- `tail -n 50 logs/factory.log` (errors).
- YouTube Studio (are the Shorts performing, is anything flagged).
- Google Cloud > YouTube Data API v3 > **Quotas** (you should be far below 10,000 units).

### Updating the code

```bash
cd /opt/gta6-clone && git pull
cp -r gta6-shorts-factory/. /opt/gta6-shorts-factory/
cd /opt/gta6-shorts-factory && source .venv/bin/activate && pip install -r requirements.txt
```

Your `.env`, `client_secret.json`, `token.json`, and `state/` are not in the repo, so the copy does not overwrite them.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Missing settings: TWITCH_CLIENT_ID...` | `.env` missing, or not in the project folder | `ls -la .env`, then fill in step 6 |
| `Font not found at ...` | `fonts-dejavu-core` not installed | `sudo apt install fonts-dejavu-core`, or set `FONT_PATH` |
| `No Twitch category matched` | GTA VI category not live on Twitch yet, or name differs | Set `TWITCH_GAME_ID` manually (Part 1, section 2.4) |
| Twitch returns 401 repeatedly | Wrong Client ID or Secret | Regenerate the secret in dev.twitch.tv and update `.env` |
| `Only 0 usable clip(s)` (exit 2) | Quiet period, or no clips in 24 hours | Normal; the next run will try again. Raise `TWITCH_LOOKBACK_HOURS` if needed |
| Downloads fail with 403 or 404 | Twitch changed its clip CDN URL pattern | Update `Clip.media_url` in `twitch_downloader.py` |
| `Rendered 0s` or MoviePy errors about frames | Corrupt source MP4 | The run skips bad clips; check the warnings in `factory.log` |
| Render takes forever or the process is killed | Out of memory on a 1 GB server | Add swap (2.3), lower `RENDER_PRESET` to `ultrafast`, or use a 2 GB plan |
| `No usable YouTube token` | `token.json` missing on the server | Copy it again (step 8) |
| `refresh token was rejected` | Token revoked, or app was in Testing mode 7+ days | Publish the OAuth app (Part 1, 1.6), then re-run `python youtube_uploader.py --auth` on your computer and copy the new `token.json` |
| `quotaExceeded` | Used all 10,000 units for the day | Wait for the reset at midnight Pacific Time. It should not happen at one upload per day |
| Upload succeeds but video is private | Project not yet through the YouTube API audit | Expected. See Part 1, 1.10 |
| `Another run is still in progress` | A previous run is still working, or crashed with the lock held | Check `ps aux | grep main.py`. The lock releases when a process ends |
| Disk full | Old output files kept because `KEEP_OUTPUT=true` | `rm output/*.mp4`, and set `KEEP_OUTPUT=false` |

To see what happened in a run, search the log: `grep -n "ERROR\|WARNING" logs/factory.log | tail -n 40`.

---

## 12. Before you go live: policy and rights

Automated re-uploads of other people's clips carry real risk. Please consider these points before you schedule daily public uploads:

- **Clip creators own their clips.** Crediting them is necessary, not sufficient. The description already credits each creator with a link to their clip. Consider asking the top creators for permission, or using a clip allowlist.
- **Rockstar Games and Take-Two own GTA VI.** Read their current policies on fan content and monetisation. Their rules can change, and they decide what is allowed.
- **YouTube's "reused content" policy** targets mass-produced, repetitive, or unaltered re-uploads. A Short that adds real commentary, editing, or a unique hook is safer than a straight copy. Keep the blurred layout, the hook, and credits, and consider adding your own commentary over time.
- **Keep the metadata accurate.** The metadata prompt already forbids invented claims. Misleading titles produce viewer complaints and channel penalties.
- **Start private, review the first batch, then decide** whether to publish.

This is not legal advice. Please check the current terms yourself.

---

## Checklist

- [ ] Server (or local machine) running Ubuntu 24.04 or equivalent, with ffmpeg and fonts installed
- [ ] Swap added (if 1 GB RAM)
- [ ] Timezone set
- [ ] Project in `/opt/gta6-shorts-factory`, venv created, `pip install -r requirements.txt` done
- [ ] `.env` filled in and `chmod 600`
- [ ] `client_secret.json` and `token.json` copied and `chmod 600`
- [ ] `python tests/smoke_test_editor.py` prints OK
- [ ] `python main.py --dry-run` produces a video you have reviewed
- [ ] `python main.py` uploads a private Short you have reviewed in YouTube Studio
- [ ] Cron line installed with `crontab -e`, verified with `crontab -l`
