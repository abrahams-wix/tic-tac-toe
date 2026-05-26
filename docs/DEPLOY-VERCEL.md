# Deploying to Vercel

This repository is a **Vite + React SPA** with a **separate WebSocket game server**. It is not an Express + `public/` app. Vercel hosts only the static frontend built to `dist/`.

## What Vercel runs

| Component | On Vercel? | Notes |
|-----------|------------|--------|
| React UI (`npm run build` → `dist/`) | Yes | Framework: Vite (`vercel.json`) |
| WebSocket server (`server/index.js`) | **No** | Needs a long-lived process (Render, Railway, Fly.io, etc.) |

Online multiplayer requires both: the SPA on Vercel and the game server on a host that supports persistent WebSockets.

## Prerequisites

- [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
- Logged in: `vercel login`
- Deploy from the **repository root** (where `vercel.json` and `package.json` live), not `server/`

## npm registry (Wix / corporate mirror)

Vercel cannot reach private registries. This project pins the public registry:

```ini
# .npmrc
registry=https://registry.npmjs.org/
```

If `package-lock.json` contains `npm.dev.wixpress.com` URLs, regenerate locally:

```bash
rm -rf node_modules package-lock.json
npm install
git add .npmrc package-lock.json
```

Commit before deploying.

## Environment variables (Vercel project settings)

| Name | Example | Purpose |
|------|---------|---------|
| `VITE_WS_URL` | `wss://your-ws-host.example.com` | WebSocket URL baked into the client build |

Without `VITE_WS_URL`, the production build defaults to `ws://localhost:3046` (online mode will not connect).

After changing env vars, trigger a **redeploy** so Vite picks them up at build time.

## Deploy commands

From the repo root:

```bash
# Preview deployment
npx vercel

# Production
npx vercel --prod
```

Link to GitHub in the Vercel dashboard for automatic deploys on push to `main`.

## Configuration files

- **`vercel.json`** — Explicit Vite build, `dist` output, SPA rewrite to `index.html` (avoids 404 on client-side routes).
- **No root `index.js` Express entry** — Not used; adding one with a `public/` folder can cause Vercel to deploy static-only (see troubleshooting).

## WebSocket server (separate host)

Run locally:

```bash
npm run server
```

For production, deploy `server/` as a Node service (example: Render web service, start command `node server/index.js`, set `PORT`). Expose `wss://` via the platform’s TLS terminator, then set `VITE_WS_URL` on Vercel to that URL.

## Post-deploy verification

### Frontend (Vercel)

| Check | Expected |
|-------|----------|
| `GET /` | `200`, React app loads |
| `GET /assets/*` | `200`, JS/CSS bundles |
| Build logs | Vite build (not ~50ms static-only with no framework) |
| `vercel inspect <url>` | Static output from `dist/` (no Express lambda required for this project) |

### Online mode (end-to-end)

| Check | Expected |
|-------|----------|
| Local / vs CPU | Works without WebSocket server |
| Online + lobby | Connects when `VITE_WS_URL` points to a live `wss://` server |
| Live rooms list | Updates when game server is reachable |

## Troubleshooting

### `404: NOT_FOUND` on `/`

- **Wrong project type:** This app has no Express API routes on Vercel. A 404 on `/` usually means the Vite build did not run or `outputDirectory` is wrong.
- **Fix:** Confirm `vercel.json` has `"framework": "vite"` and `"outputDirectory": "dist"`. Redeploy from repo root.

### Build ~50ms, “Output Directory: public”, no framework

- **Cause:** Same as your Express + `public/` project: Vercel treated the repo as static-only.
- **This repo:** There is no `public/` HTML site at the root; use Vite settings in `vercel.json`. Do not add a root `index.js` + `public/` unless you intentionally switch architectures.

### `npm install` failed — `ENOTFOUND` / `npm.dev.wixpress.com`

- **Cause:** Lockfile or global npm config points at a private registry.
- **Fix:** Project `.npmrc` + regenerate `package-lock.json` (see above).

### Online mode stuck on “Connecting…”

- **Cause:** `VITE_WS_URL` missing, wrong, or game server not deployed.
- **Fix:** Deploy `server/index.js` elsewhere; set `wss://` URL on Vercel; redeploy frontend.

### Console: `WebSocket connection to 'ws://localhost:3046/' failed` (`ERR_CONNECTION_REFUSED`)

- **Cause:** The production build on Vercel was connecting to **your laptop’s** `localhost`, not a real server. Browsers load the site from `games-*.vercel.app`, so `localhost:3046` is wrong unless you are developing locally.
- **Fix (production):**
  1. Deploy the game server (see `render.yaml` in the repo root → Render **New → Blueprint**).
  2. Copy the Render URL (e.g. `wss://tic-tac-toe-ws.onrender.com` — use `wss://`, not `ws://`).
  3. Vercel → Project → **Settings → Environment Variables** → `VITE_WS_URL` = that URL.
  4. **Redeploy** the Vercel project (env vars are applied at build time).
- **Fix (local dev):** In one terminal `npm run server`, in another `npm run dev` (not the Vercel URL).

### Deployed from `server/` subdirectory

- **Fix:** Always run `vercel` from the repo root.

## Contrast with Express + `public/` projects

If you also maintain an Express app with static files under `public/`, that layout needs:

- Root `index.js` exporting the Express app
- `vercel.json` with `@vercel/node` + `@vercel/static` and explicit routes
- Rewrites so `/styles/*` maps to `/public/styles/*`, not `/public/styles/*` as the browser path

**This tic-tac-toe project does not use that pattern.** Use this document for the Vite frontend only; host WebSockets separately.

## Quick checklist

| Check | Why |
|-------|-----|
| `.npmrc` → `registry.npmjs.org` | Vercel can install dependencies |
| `package-lock.json` has no Wix URLs | Same |
| `vercel.json` framework `vite`, output `dist` | Correct build pipeline |
| `VITE_WS_URL` set for production | Online mode |
| Game server deployed elsewhere | WebSockets |
| Deploy from repo root | Correct context |
| `vercel --prod` after env changes | Rebuild client with new WS URL |
