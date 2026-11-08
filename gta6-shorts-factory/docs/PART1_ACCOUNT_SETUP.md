# Part 1: Accounts and API credentials

This part is manual. An AI agent cannot solve CAPTCHAs, pass phone verification, or create accounts on your behalf, so you do these steps yourself. It takes about 45 minutes. Keep the credentials out of chat, email, and git.

You will end up with these:

| Item | Where it goes |
|---|---|
| `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` | `.env` |
| `client_secret.json` (Google OAuth client, Desktop app) | project folder, never committed |
| `token.json` (created by the one-time login in step 1.8) | project folder, never committed |
| `GEMINI_API_KEY` | `.env` |

---

## 0. Before you start

- [ ] A Google account you control. Use the same one that owns (or will own) the YouTube channel.
- [ ] The YouTube channel exists. Go to youtube.com, click your avatar, then **Create a channel** if you don't have one.
- [ ] A phone that can receive SMS or authenticator codes. Twitch requires two-factor authentication before you can register an app.
- [ ] A password manager. You will copy three secrets that are shown only once.

---

## 1. Google Cloud Console (YouTube upload + Gemini key)

Open https://console.cloud.google.com and sign in with the Google account from step 0.

### 1.1 Create a project

1. Top bar, click the project picker (it says **Select a project** or the name of your current project).
2. In the dialog, click **NEW PROJECT**.
3. **Project name:** `gta6-shorts-factory`. Leave the organization as "No organization" if asked.
4. Click **CREATE**. Wait for the notification, then click **SELECT PROJECT** so the project picker shows the new name.

You do **not** need to add a billing account for the YouTube Data API. Gemini has its own key process (step 1.10).

### 1.2 Enable the YouTube Data API v3

1. Left navigation menu (the three bars), then **APIs & Services** > **Library**.
2. In the search box, type `YouTube Data API v3` and click the result.
3. Click **ENABLE**. The page changes to show the API's overview, with "API Enabled" at the top.

### 1.3 Set up the OAuth consent screen

Google renamed this area to **Google Auth Platform**. The menu may read **Google Auth Platform** instead of **OAuth consent screen**. Either way:

1. Left menu: **APIs & Services** > **OAuth consent screen**. If you see a **Get started** button, click it.
2. **App name:** `GTA6 Shorts Factory`
3. **User support email:** your email (choose it from the dropdown).
4. **Audience:** choose **External**. Click **Next**.
5. **Contact information:** your email. Click **Next**, accept the Google API Services User Data Policy, then **Continue** and **Create**.

### 1.4 Add the upload permission (scope)

1. Still on the consent screen, open **Data Access** (or **Scopes**, depending on the layout).
2. Click **Add or remove scopes**.
3. In the filter box, type `youtube.upload`.
4. Tick **`.../auth/youtube.upload`** (the one that says "Manage YouTube videos" or "Upload videos"). Do not tick `youtube.force-ssl` or other scopes; you do not need them.
5. Click **Update**, then **Save**.

### 1.5 Add yourself as a test user

1. Open **Audience** (or **Test users**).
2. Under **Test users**, click **+ ADD USERS**, enter your Gmail address, and click **Save**.

### 1.6 Publish the app (important)

1. On the **Audience** page, click **PUBLISH APP** and confirm.

Why: while the app is in **Testing** mode, Google expires refresh tokens after 7 days, and your uploader would stop working weekly. Publishing removes that limit. You will see an "unverified app" warning the first time you log in. That is expected for an app you made yourself: click **Advanced**, then **Go to GTA6 Shorts Factory (unsafe)**. The word "unsafe" refers only to Google not having reviewed the app.

### 1.7 Create the OAuth client (the `client_secret.json` file)

1. Left menu: **APIs & Services** > **Credentials**, or **Google Auth Platform** > **Clients**.
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
3. **Application type:** **Desktop app**. (Not "Web application". The Desktop type is what allows the one-time login from your own computer.)
4. **Name:** `factory-desktop`. Click **CREATE**.
5. In the popup, click **DOWNLOAD JSON**.
6. Rename the downloaded file to `client_secret.json` and move it into the `gta6-shorts-factory/` folder on your computer.

Do not commit it to git. The `.gitignore` already blocks `client_secret*.json`.

Note: an API key is not enough for uploads. Uploads write to your channel, so they need your permission (OAuth). API keys only work for public read-only endpoints.

### 1.8 Create `token.json` with the one-time login

This runs on your own computer, because it needs a browser. Do it after you have a Python environment (see Part 2, step 2.5), with `client_secret.json` in the project folder:

```bash
cd gta6-shorts-factory
python youtube_uploader.py --auth
```

A browser opens. Sign in with the Google account that owns the YouTube channel. Google shows a list of permissions. Tick the box that allows managing your YouTube videos, then **Continue**. The terminal then prints "Token saved to .../token.json".

`token.json` is now the permanent credential the server uses. Copy it to the server (Part 2, step 2.9). Anyone holding that file can upload to your channel, so treat it like a password.

### 1.9 Understand the quota (10,000 units per day)

Open **APIs & Services** > **YouTube Data API v3** > **Quotas & System Limits**. The default is **10,000 units per day**, resetting at midnight Pacific Time.

| Operation | Cost | What this factory does |
|---|---|---|
| `videos.insert` (upload) | **1,600 units** | One per run. That is about 6 uploads a day at the default quota. |
| `search.list` | 100 units | **Not used.** Clips come from Twitch, which costs nothing here. |
| `videos.list`, `channels.list` | 1 unit each | Not used by the pipeline. |

A daily run uses 1,600 of 10,000 units, so the quota is not a constraint at one Short per day.

### 1.10 Unverified projects: the upload restriction (read this)

YouTube locks videos uploaded through the API from projects that have not passed the **YouTube API Services audit** to **private**, whatever privacy you set. Your first Shorts will therefore be private. That is good for a test run. To publish publicly:

1. On the **YouTube Data API v3** page, follow the link to request an audit or quota extension, which opens the **YouTube API Services Audit and Quota Extension** form.
2. Describe the use case honestly: an automated uploader for a channel you own, uploading your own edited Shorts, with a human reviewing the first batch.
3. Wait for review. It can take days to weeks.

Until you pass, keep `YOUTUBE_PRIVACY_STATUS=private` in `.env`, review the Shorts in YouTube Studio, and make them public manually if you want.

### 1.11 Create the Gemini API key (for titles and hashtags)

1. Open https://aistudio.google.com/app/apikey and sign in with the same Google account.
2. Click **Create API key**.
3. Choose the **gta6-shorts-factory** project from step 1.1. Click **Create key**.
4. Copy the key and paste it into `.env` as `GEMINI_API_KEY`.

Notes:
- Gemini has a free tier. Its limits and model names change, so check the rate limits page linked from AI Studio if you see 429 errors.
- Under Google's free-tier terms, prompts may be used to improve Google products. The prompts here contain only public clip titles and creator names, so this is low sensitivity. Read the current terms before you decide.
- Pay-as-you-go pricing for Flash-class models is a fraction of a cent per Short. Set a budget alert in Google Cloud Billing if you enable billing.
- The default model is `gemini-2.5-flash` (set by `GEMINI_MODEL`). If Google retires it, change `GEMINI_MODEL` to the current Flash model listed in AI Studio. You do not need to change any code.

---

## 2. Twitch Developer Portal (Client ID and Secret for the Clips API)

### 2.1 Turn on two-factor authentication

1. Sign in at https://www.twitch.tv.
2. Click your avatar > **Settings** > **Security and Privacy**.
3. Under **Two-Factor Authentication**, click **Set up** and follow the prompts. The Developer Console will not let you register an app without this.

### 2.2 Register the application

1. Open https://dev.twitch.tv/console and click **Log In** if prompted.
2. Click **Applications** in the left menu, then **+ Register Your Application**.
3. **Name:** must be unique across all of Twitch. Use something like `gta6-shorts-factory-yourname`. If it says "already in use", add digits.
4. **OAuth Redirect URLs:** enter `http://localhost`. This field is required, but this pipeline uses the client-credentials flow, which never redirects, so the value is not used.
5. **Category:** choose **Website Integration** (or **Other** if that is the only option).
6. **Client Type:** **Confidential**.
7. Complete the CAPTCHA and click **Create**.

### 2.3 Copy the Client ID and generate the Client Secret

1. In the Applications list, click **Manage** on your app.
2. Copy the **Client ID** into `.env` as `TWITCH_CLIENT_ID`.
3. Click **New Secret**, confirm, and immediately copy the **Client Secret** into `.env` as `TWITCH_CLIENT_SECRET`. Twitch shows it only once. If you lose it, click **New Secret** again, which invalidates the old one.

The pipeline uses app access only. It reads public clip data and never logs in as a Twitch user.

### 2.4 Confirm the game category

The downloader searches Twitch for the category **Grand Theft Auto VI**. You can check the name Twitch uses at https://www.twitch.tv/directory. Before GTA VI is live, the category may not exist yet, and the downloader will say so.

If the automatic lookup fails, find the category ID and set it manually:
- Its page URL is `https://www.twitch.tv/directory/category/<slug>`. The ID is shown in the Twitch API. The downloader prints the category names it found when the lookup fails, which helps you pick the right one.
- Put it in `.env` as `TWITCH_GAME_ID=<number>`.

---

## 3. Local `.env` file (keeping secrets out of the code)

`.env` is a plain-text file of `NAME=value` lines. Python reads it at startup with `python-dotenv`. The code never contains a secret, so you can share or publish the code safely.

### 3.1 Create the project folder and the file

From the root of the repository (or anywhere you like on your computer):

```bash
cd gta6-shorts-factory
cp .env.example .env
```

On Windows PowerShell, use `copy .env.example .env`.

### 3.2 Fill it in

Open `.env` in a text editor and replace the placeholders:

```dotenv
TWITCH_CLIENT_ID=abc123yourrealid
TWITCH_CLIENT_SECRET=xyz789yourrealsecret
GEMINI_API_KEY=AIza...yourrealkey
YOUTUBE_CLIENT_SECRETS_FILE=client_secret.json
YOUTUBE_TOKEN_FILE=token.json
YOUTUBE_PRIVACY_STATUS=private
```

Rules:
- No quotes are needed. Don't put spaces around `=`.
- Never paste real values into chat, screenshots, issues, or commits.
- Keep `.env`, `client_secret.json`, and `token.json` in the project folder only. The `.gitignore` covers all three.

### 3.3 Lock down the file permissions

On Linux, macOS, or WSL:

```bash
chmod 600 .env client_secret.json token.json
```

This means only your user can read them.

### 3.4 Check the folder before any commit

```bash
git status --short
```

None of `.env`, `client_secret.json`, or `token.json` should appear in the list. If one does, stop and check `.gitignore` before you commit anything.

---

## Checklist

- [ ] Google Cloud project created
- [ ] YouTube Data API v3 enabled
- [ ] OAuth consent screen set up, `youtube.upload` scope added, app published
- [ ] Desktop OAuth client created and `client_secret.json` saved in the project folder
- [ ] `python youtube_uploader.py --auth` run once, `token.json` created
- [ ] Gemini API key created and saved in `.env`
- [ ] Twitch two-factor authentication on
- [ ] Twitch app registered, Client ID and Client Secret saved in `.env`
- [ ] `.env` filled in, `chmod 600` applied, `git status` shows no secrets
- [ ] YouTube API audit form submitted (optional, needed for public uploads)

Next: **Part 2, `docs/PART2_INFRASTRUCTURE.md`**.
