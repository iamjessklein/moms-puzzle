# 🧩 Mom's Puzzle — Setup Instructions

Total time: ~15 minutes. You'll need your laptop.

---

## STEP 1 — Create a free Supabase account (stores the photos)

1. Go to **https://supabase.com** and sign up for free
2. Click **"New Project"**, give it any name (e.g. "moms-puzzle"), set a password, click Create
3. Wait ~1 minute for it to set up
4. Go to **Table Editor** (left sidebar) → **New Table**
   - Name: `puzzles`
   - Uncheck "Enable Row Level Security (RLS)" for now
   - Add these columns:
     - `key`           → type: `text`, is unique: ✓
     - `title`         → type: `text`
     - `password_hash` → type: `text`
     - `data`          → type: `jsonb`
   - Click Save
5. Go to **Settings → API** (left sidebar)
   - Copy the **Project URL** (looks like `https://xxxx.supabase.co`)
   - Copy the **anon public** key (long string starting with `eyJ...`)
6. Open the file `src/supabase.js` in the project folder and paste them in:
   ```js
   const SUPABASE_URL = 'https://xxxx.supabase.co'   // ← your URL
   const SUPABASE_ANON_KEY = 'eyJ...'                 // ← your anon key
   ```

---

## STEP 2 — Create a free GitHub account & repo

1. Go to **https://github.com** and sign up (or log in)
2. Click the **+** button → **New repository**
   - Name it exactly: `moms-puzzle`
   - Make it **Public**
   - Click **Create repository**
3. You'll see a page with setup commands — keep this tab open

---

## STEP 3 — Install Node.js (if you don't have it)

1. Go to **https://nodejs.org** and download the LTS version
2. Install it (just click through the installer)
3. Open **Terminal** (Mac: search "Terminal" in Spotlight)

---

## STEP 4 — Deploy the app

Open Terminal and run these commands one by one:

```bash
# Go into the project folder (adjust path to wherever you saved it)
cd ~/Downloads/moms-puzzle

# Install dependencies
npm install

# Set your GitHub username (replace with yours)
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/moms-puzzle.git
git push -u origin main

# Deploy to GitHub Pages!
npm run deploy
```

When it finishes you'll see: **"Published"** ✅

---

## STEP 5 — Enable GitHub Pages

1. Go to your repo on GitHub: `github.com/YOUR_USERNAME/moms-puzzle`
2. Click **Settings** → **Pages** (left sidebar)
3. Under "Branch", select **gh-pages** → click Save
4. Wait 1–2 minutes, then your app is live at:
   **`https://YOUR_USERNAME.github.io/moms-puzzle/`**

---

## STEP 6 — Use it!

1. Open `https://YOUR_USERNAME.github.io/moms-puzzle/` on your phone
2. Upload a photo, write your message, tap **Create Puzzle & Get Link**
3. You'll get a short link like `https://YOUR_USERNAME.github.io/moms-puzzle/?p=rose-432`
4. Text that link to your mom — she taps it and the puzzle opens! 🎉

---

## Updating the app later

If you want to make changes, edit the files and run:
```bash
npm run deploy
```
That's it — it redeploys automatically.

---

## Troubleshooting

**"npm: command not found"** → Node.js isn't installed. Go back to Step 3.

**Photos not saving** → Double-check you pasted the Supabase URL and key into `src/supabase.js` and redeployed.

**Page not loading** → Make sure the `base` in `vite.config.js` matches your repo name exactly.

**RLS error from Supabase** → Go to Supabase → Table Editor → puzzles → RLS → make sure it's disabled, or add a policy that allows all inserts and selects.
