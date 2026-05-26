# Deploying to Render (recommended)

Render can host **both** the React UI and the WebSocket game server in a **single Web Service** at one public URL (for example `https://tic-tac-toe.onrender.com`). That is simpler than splitting Vercel (UI) + Render (API).

Official references:

- [Web Services](https://render.com/docs/web-services)
- [WebSockets on Render](https://render.com/docs/websocket)
- [Deploy Node on Render](https://render.com/docs/deploy-node-express-app)
- [Blueprint spec](https://render.com/docs/blueprint-spec)

## How this repo is set up

| Piece | Implementation |
|--------|----------------|
| Build | `npm install && npm run build` → `dist/` (Vite) |
| Start | `npm start` → `node server/index.js` |
| HTTP | Express serves `dist/` + SPA fallback to `index.html` |
| WebSocket | `ws` attached to the same HTTP server (same port) |
| Health check | `GET /health` → `200 ok` |
| Client WS URL | Same origin in production (`wss://your-app.onrender.com`) |

Render routes **all** public traffic (HTTP and WebSocket upgrades) to one port (`PORT`, default 10000). Use **`wss://`** in the browser, not `ws://`.

## Prerequisites

- GitHub repo pushed: [abrahams-wix/tic-tac-toe](https://github.com/abrahams-wix/tic-tac-toe)
- [Render account](https://dashboard.render.com)
- Project `.npmrc` uses `registry.npmjs.org` (Vercel/Render cannot use private Wix npm mirrors)

## Option A — Blueprint (fastest)

1. Open [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
2. Connect the `tic-tac-toe` repository.
3. Render reads [`render.yaml`](../render.yaml) at the repo root.
4. Click **Apply** / deploy.
5. Wait for the first build (~2–4 minutes). Build must run `npm run build` so `dist/` exists.

Your app will be live at:

```text
https://tic-tac-toe.onrender.com
```

(Exact subdomain depends on the service **name** in Render.)

## Option B — Manual Web Service

1. **New** → **Web Service** → connect the repo.
2. Settings:

| Field | Value |
|--------|--------|
| Language | Node |
| Branch | `main` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

3. **Environment variables** (optional but recommended):

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `22` |

4. **Create Web Service**.

## Local production smoke test

Before or after Render deploy, simulate production locally:

```bash
npm install
npm run build
npm start
```

Open `http://localhost:3046` — UI and WebSocket share that port. Online mode and the live room lobby should work without `VITE_WS_URL`.

For day-to-day development, keep using two terminals:

```bash
npm run server   # WebSocket only (no dist required)
npm run dev      # Vite at http://localhost:5173 → ws://localhost:3046
```

## Post-deploy verification

| Check | Expected |
|--------|----------|
| `GET /` | `200`, tic-tac-toe UI |
| `GET /health` | `200`, body `ok` |
| `GET /assets/*` | `200`, JS/CSS bundles |
| Local / vs CPU | Works |
| Online + lobby | Connects over `wss://` (same host) |
| Browser console | No `localhost:3046` errors on Render URL |

Optional CLI:

```bash
curl -s https://YOUR-SERVICE.onrender.com/health
# ok
```

## Free tier limitations

Render’s **free** Web Service:

- **Spins down** after ~15 minutes without traffic. First visit after idle can take **30–60 seconds** (cold start).
- **WebSockets drop** when the instance sleeps or redeploys; clients should reconnect (future improvement).
- **Not** suitable for high-traffic production without a paid plan.

Paid plans keep instances warm longer and scale horizontally; WebSocket clients may land on different instances (no in-memory room sharing across instances without Redis or similar).

## Vercel + Render vs Render only

| Setup | URLs | When to use |
|--------|------|-------------|
| **Render only** | One `onrender.com` URL | Simplest; full app + multiplayer |
| **Vercel + Render** | Vercel = UI, Render = `wss://…` | CDN on Vercel; set `VITE_WS_URL` on Vercel to Render’s `wss://` URL and redeploy |

This codebase auto-uses **same-origin** WebSockets in production builds, so **Render-only** needs no `VITE_WS_URL`.

## Troubleshooting

### Build fails on `npm install` (`ENOTFOUND`, `wixpress`)

Regenerate the lockfile with the project [`.npmrc`](../.npmrc):

```bash
rm -rf node_modules package-lock.json
npm install
git add .npmrc package-lock.json && git commit -m "Use public npm registry for deploys"
```

### UI loads but online mode never connects

- Confirm `dist/` was built (`npm run build` in build logs).
- Open DevTools → Network → WS; URL should be `wss://YOUR-SERVICE.onrender.com`, not `localhost`.
- Service must be **awake** (free tier cold start).

### `WebSocket connection failed` right after deploy

Normal during instance replacement. Refresh after deploy finishes.

### Only WebSocket works, no UI

Build step did not produce `dist/`. Fix **Build Command** to include `npm run build`.

## Quick checklist

| Step | Done? |
|------|--------|
| `render.yaml` committed | |
| Repo connected in Render | |
| Build: `npm install && npm run build` | |
| Start: `npm start` | |
| Health check `/health` | |
| `package-lock.json` has no Wix registry URLs | |
| Test Online mode on `onrender.com` URL | |
