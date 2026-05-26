# Tic-Tac-Toe

A browser-based tic-tac-toe application with local pass-and-play, single-player AI, and real-time multiplayer. The client is a React SPA; game authority for online matches lives on a Node.js WebSocket server.

**Repository:** [github.com/abrahams-wix/tic-tac-toe](https://github.com/abrahams-wix/tic-tac-toe)

## Features

| Mode | Description |
|------|-------------|
| **Local (hot-seat)** | Two players alternate on one device. Turn order and win detection run entirely in the browser. |
| **vs CPU** | Single-player mode with a client-side opponent. |
| **Online (multiplayer)** | Real-time PvP over WebSockets. The server validates moves, owns game state, and broadcasts updates to both clients. |

Additional behavior:

- **Live room lobby** — A persistent lobby connection lists active rooms in all modes. Rooms show human-readable names and player slots.
- **Matchmaking** — Join without a `roomId` to enter the next available waiting room or create a new one.
- **Targeted join** — Join a specific room from the lobby when a slot is open.
- **Server-authoritative state** — Online board, turn, and outcome are defined by the server; clients render server snapshots.
- **Display names** — Players and rooms receive random `<color> <fruit>` labels (for example, `Crimson Apple`) from a server-side dictionary.
- **Session UX** — Modals for matchmaking, opponent connected, game over, and confirmation when leaving an active online session.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  React client (Vite)                                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ useGameSession │ Mode handlers │  │ useRoomLobby   │ │
│  │ (game state)   │ Local / CPU / │  │ (room list)    │ │
│  │                │ Multiplayer   │  │                │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
└──────────────────────────┬──────────────────────────────┘
                           │ WebSocket (port 3046)
┌──────────────────────────▼──────────────────────────────┐
│  Node.js server (`ws`)                                  │
│  Rooms · join/move handlers · lobby broadcast           │
└─────────────────────────────────────────────────────────┘
```

- **Mode handlers** (`src/modeHandlers/`) encapsulate input rules and side effects per game mode.
- **Game store** (`src/game/GameStore.js`) bridges handlers to React state.
- **Protocol** — Shared message types and builders in `server/protocol.js` (re-exported to the client as `src/protocol.js`).

For message-level API documentation, see [server/messages.md](./server/messages.md).

## Tech stack

| Layer | Technology |
|-------|------------|
| UI | React 19, CSS |
| Build / dev server | Vite 8 |
| Real-time transport | WebSocket (`ws`) |
| Backend runtime | Node.js (ES modules) |

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (20+ recommended)
- npm

## Development

Install dependencies:

```bash
npm install
```

Start the WebSocket server and the Vite dev server in **two terminals**:

```bash
# Terminal 1 — game server (default: ws://localhost:3046)
npm run server

# Terminal 2 — client (default: http://localhost:5173)
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`). Online mode requires the WebSocket server to be running.

### Other scripts

| Command | Purpose |
|---------|---------|
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## Project structure

```
games/
├── server/                 # WebSocket server and game logic
│   ├── handlers/           # join, move, disconnect, leave
│   ├── gameRoom.js         # Room state, board, lobby JSON
│   ├── protocol.js         # Message types and builders
│   ├── nameDictionary.js   # Color / fruit display names
│   └── messages.md         # Protocol reference
├── src/
│   ├── components/         # Board, modals, room queue
│   ├── modeHandlers/       # Local, CPU, multiplayer
│   ├── hooks/              # useGameSession, useRoomLobby
│   ├── game/               # Board utils, status labels, store
│   └── constants/          # Modes, timing, multiplayer phases
└── package.json
```

## Configuration

| Setting | Location | Default |
|---------|----------|---------|
| WebSocket URL (client) | `VITE_WS_URL` env var → `src/config/wsUrl.js` | `ws://localhost:3046` |
| Server port | `server/index.js` (`PORT` env) | `3046` |

## Deployment

| Target | What runs there |
|--------|-----------------|
| **Vercel** | React SPA only (`npm run build` → `dist/`) |
| **Render / Railway / etc.** | WebSocket game server (`npm run server`) |

The frontend does **not** use Express on Vercel. See **[docs/DEPLOY-VERCEL.md](./docs/DEPLOY-VERCEL.md)** for deploy commands, `VITE_WS_URL`, npm registry fixes, and troubleshooting (including differences from Express + `public/` projects).

**Production (frontend):** https://games-tau-one.vercel.app

```bash
# From repo root — frontend
npx vercel --prod

# Set in Vercel project settings, then redeploy:
# VITE_WS_URL=wss://your-game-server.example.com
```

Local and vs CPU work on Vercel without extra setup. Online mode needs a deployed WebSocket server and `VITE_WS_URL`.

## Contributing

1. Fork the repository and create a feature branch.
2. Run `npm run lint` and verify local + online modes manually.
3. Open a pull request with a concise description of the change and how you tested it.

## License

This project is private (`package.json`). Add a `LICENSE` file if you intend to open-source it.
