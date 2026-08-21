# Francirene — Backend Deployment & Android APK Build

Your app has two moving parts:
1. **Backend** (this Node/Express project) — needs to run 24/7 somewhere on the internet.
2. **Android app** (`android-native/`) — a **fully native Kotlin app** (not a WebView wrapper) with real screens for every role — landing, admin/parent/student login, enrollment form, admin management (enrollments, resources, timetables, reviews, settings), and read-only parent/student dashboards. It talks to your backend over its REST API using Retrofit, and matches your site's actual color palette (`#1e40af` blue, `#0f766e` teal, `#f59e0b` amber). Built into a `.apk` automatically by GitHub Actions.

The Android app does **not** work without step 1 done first — every screen calls your live API for real data.

---

## Step 1 — Deploy the backend

Easiest free option: **Render**.

1. Push this repo to GitHub (if not already there).
2. Go to https://render.com → New → Blueprint → connect your repo. It will detect `render.yaml` automatically.
3. Render will ask you to fill in the env vars marked `sync: false`:
   - `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_SERVICE`, `ADMIN_EMAIL` — copy these from your local `.env`.
   - **Important:** since your `.env` password was in a file that left your machine, rotate the Gmail app password before putting it in Render (Google Account → Security → App Passwords).
4. Deploy. You'll get a URL like `https://francirene-backend.onrender.com`.
5. Confirm it works: visit `https://your-url.onrender.com/api/health` → should return `{"success":true,"status":"ok"}`.

*(Any other Node host — Railway, Fly.io, a VPS — works too; `render.yaml` is just a convenience for Render specifically. As long as you end up with a public HTTPS URL, step 2 works the same.)*

> Note: Render's free tier uses ephemeral disk storage, so files saved to `/uploads` will be wiped on redeploy/restart. Fine for testing; for production-grade file persistence you'd want a persistent disk or S3-style storage — ask me if you want that wired in.

---

## Step 2 — Point the Android app at your backend

In your GitHub repo: **Settings → Secrets and variables → Actions → Variables tab → New repository variable**

- Name: `APP_BACKEND_URL`
- Value: `https://francirene-backend.onrender.com` (your real URL from Step 1, no trailing slash)

---

## Step 3 — Build the APK via GitHub Actions

1. Go to your repo's **Actions** tab.
2. Select **"Build Android APK"** in the left sidebar.
3. Click **Run workflow** (or just push a change under `android-native/`).
4. When it finishes (~3–5 min), open the run and scroll to **Artifacts**:
   - `francirene-debug-apk` — installable immediately, for testing (self-signed).
   - `francirene-release-apk` — same, unless you've added a real signing key (see below).
5. Download the `.zip`, extract the `.apk`, transfer to an Android phone, and install (you'll need to allow "install from unknown sources" the first time).

---

## Optional — Real release signing (for Play Store)

Without a signing key, the "release" APK is signed with Android's auto-generated debug key — installable and testable, but **not** accepted by Google Play. To make it Play-Store-ready:

```bash
keytool -genkey -v -keystore release.keystore -alias francirene \
  -keyalg RSA -keysize 2048 -validity 10000
```

Then add these as **repository secrets** (Settings → Secrets and variables → Actions → Secrets tab):
- `KEYSTORE_BASE64` — output of `base64 -i release.keystore`
- `KEYSTORE_PASSWORD`
- `KEY_ALIAS` (e.g. `francirene`)
- `KEY_PASSWORD`

The workflow already checks for these and will sign the release build automatically once present — no other changes needed. Keep the keystore file itself somewhere safe outside git; losing it means you can never update the Play Store listing under the same app.

---

## Local development (unchanged)

```bash
npm install
npm start        # or: npm run dev  (nodemon)
```

Runs on `http://localhost:3010` as before. The `android-native/` folder is independent and only touched by the GitHub Actions workflow — it won't affect your local backend workflow at all.
