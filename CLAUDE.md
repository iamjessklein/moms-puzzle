# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install --legacy-peer-deps   # install dependencies (--legacy-peer-deps required due to vite 8 / plugin-react peer conflict)
npm run dev                      # local dev server
npm run build                    # production build → dist/
npm run deploy                   # build + push dist/ to gh-pages branch (deploys to GitHub Pages)
```

There are no tests or linting configured.

## Architecture

Single-page React app (Vite) deployed as a static site on GitHub Pages at `iamjessklein.github.io/moms-puzzle`. All logic lives in two files:

- **`src/App.jsx`** — the entire app: UI components, state, puzzle logic, Supabase calls
- **`src/supabase.js`** — Supabase client (URL + anon key hardcoded)

### App flow

The app has one URL parameter (`?p=<key>`) that controls which mode renders:

- **No `?p=` param → Builder** — lets you upload photos, set a title/message/password/difficulty, save to Supabase, and get a shareable link
- **`?p=<key>` → Password screen → Puzzle player** — loads puzzle metadata, verifies the password client-side (SHA-256 hash comparison), then loads full puzzle data and starts the game

### Data model

Supabase table `puzzles`: `key` (unique text), `title`, `password_hash`, `data` (jsonb).  
`data` contains `{ photos, title, message, from, cols, rows }` — photos are base64 JPEG data URIs compressed to max 600px. The password is never stored in plaintext; only its SHA-256 hash is saved.

### Deployment

The `gh-pages` branch holds the built output. `npm run deploy` builds and pushes it. The Vite `base` is set to `/moms-puzzle/` in `vite.config.js` — if the repo is ever renamed, update that value.

### PWA / home screen icon

`public/icon.svg` and `public/manifest.json` enable "Add to Home Screen" on mobile. The icon uses the Noun Project heart-puzzle image (`https://static.thenounproject.com/png/heart-puzzle-icon-7589425-512.png`) embedded in an SVG with a violet gradient background. The same image is used in-app with a CSS filter: `invert(30%) sepia(80%) saturate(500%) hue-rotate(130deg) brightness(70%)`.

### Theme

All colors and font are defined as constants at the top of `App.jsx` (e.g. `violet`, `ink`, `bg`). The font is Nunito, loaded from Google Fonts at runtime.
