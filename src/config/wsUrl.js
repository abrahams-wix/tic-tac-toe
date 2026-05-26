/**
 * WebSocket endpoint for the browser client.
 * Set VITE_WS_URL in Vercel (e.g. wss://your-game-server.example.com).
 */
const DEFAULT_WS_URL = 'ws://localhost:3046'

export const WS_URL = import.meta.env.VITE_WS_URL || DEFAULT_WS_URL
