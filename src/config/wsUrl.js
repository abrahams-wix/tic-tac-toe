/** Local WebSocket when Vite dev server and game server run separately. */
const LOCAL_DEV_WS = 'ws://localhost:3046'

function sameOriginWsUrl() {
  if (typeof window === 'undefined') return null
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}`
}

/**
 * WebSocket URL for the browser client.
 * - `VITE_WS_URL`: explicit override (e.g. Vercel UI → Render API).
 * - Dev (`npm run dev` + `npm run server`): `ws://localhost:3046`.
 * - Production on same host (Render): `wss://<your-app>.onrender.com`.
 */
export function resolveWsUrl() {
  const fromEnv = import.meta.env.VITE_WS_URL
  if (fromEnv) return fromEnv
  if (import.meta.env.DEV) return LOCAL_DEV_WS
  return sameOriginWsUrl()
}

/** @type {string | null} */
export const WS_URL = resolveWsUrl()

export const WS_CONFIGURED = WS_URL != null
