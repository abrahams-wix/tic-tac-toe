# WebSocket message protocol

All messages are JSON strings. Use `JSON.stringify` to send and `JSON.parse` on receive.

**Endpoint:** `ws://localhost:3046`

**Constants & builders:** [`protocol.js`](./protocol.js) — `messageType`, `errors`, `gameStatus`, `mark`, and `server*` / `client*` helpers.

---

## Shared types

### Game state (`state`)

Sent on `joined`, `opponent_joined`, `state`, and `player_left`. Matches `GameRoom.toJSON()`.

```json
{
  "id": "room-uuid",
  "board": [null, null, null, null, null, null, null, null, null],
  "turn": "X",
  "status": "play",
  "winner": null
}
```

| Field | Type | Values |
|-------|------|--------|
| `id` | string | Room id |
| `board` | `(null \| "X" \| "O")[]` | Length 9, indices 0–8 |
| `turn` | string | `"X"` or `"O"` — whose turn it is |
| `status` | string | `"play"` \| `"win"` \| `"tie"` |
| `winner` | string \| null | `"X"` \| `"O"` when `status` is `"win"`, else `null` |

### Error

Used for invalid JSON, unknown `type`, failed join, or rejected move.

```json
{
  "type": "error",
  "message": "Human-readable reason"
}
```

---

## Lifecycle

### 1. Connect

**When:** WebSocket opens (automatic).

**Server → client**

```json
{
  "type": "connected",
  "playerId": "player-uuid"
}
```

Client is not in a room yet. Next step: send `join`.

---

### 2. Join

**When:** Client is ready to find or create a match.

**Client → server**

```json
{
  "type": "join"
}
```

No `roomId`. Server either adds the player to a room waiting for an opponent or creates a new room.

**Server → client (success)**

```json
{
  "type": "joined",
  "roomId": "room-uuid",
  "playerIndex": 0,
  "mark": "X",
  "waiting": true,
  "state": { }
}
```

| Field | Type | Notes |
|-------|------|--------|
| `roomId` | string | Assigned by server |
| `playerIndex` | number | `0` or `1` |
| `mark` | string | `"X"` (index 0) or `"O"` (index 1) |
| `waiting` | boolean | `true` until a second player joins |
| `state` | object | Game state (see above) |

**Server → client (failure)** — use `error`, not `joined`:

```json
{
  "type": "error",
  "message": "Already in a room"
}
```

---

### 3. Opponent joined

**When:** Second player sends `join` and lands in the same room.

**Server → the player who was waiting**

```json
{
  "type": "opponent_joined",
  "waiting": false,
  "state": { }
}
```

**Server → the player who just joined** — they already received `joined` with `waiting: false`.

Both clients can start sending `move` when `waiting` is `false`.

---

### 4. Move

**When:** Player clicks a square (only after `waiting` is `false` and `state.status` is `"play"`).

**Client → server**

```json
{
  "type": "move",
  "index": 4
}
```

| Field | Type | Notes |
|-------|------|--------|
| `index` | number | Board cell `0`–`8` |

Server derives mark from `playerIndex` (do not send `X`/`O` from the client).

**Server → both players (success)**

```json
{
  "type": "state",
  "state": { }
}
```

**Server → mover only (failure)**

```json
{
  "type": "error",
  "message": "Invalid move"
}
```

Typical failure reasons: not your turn, cell taken, game over, or not in a room.

---

### 5. Disconnect

**When:** A player closes the tab or connection.

**Server → remaining player**

```json
{
  "type": "player_left",
  "playerIndex": 0,
  "state": { }
}
```

The leaving player's seat is cleared. UI may show “Opponent disconnected” and disable moves until they rejoin (rejoin not defined in v1).

---

## Flow summary

```
Client                          Server
  | open                           |
  |<──────── connected ────────────|
  |──────── join ─────────────────>|
  |<──────── joined (waiting?) ────|
  |                                |  (second client joins)
  |<──────── opponent_joined ─────|  (first client only)
  |──────── move { index } ───────>|
  |<──────── state ────────────────|  (both clients)
  |                                |
  | close                          |
  |              player_left ─────>|  (other client)
```

---

## Client handler checklist

| `type` | Action |
|--------|--------|
| `connected` | Store `playerId`; send `{ "type": "join" }` |
| `joined` | Store `roomId`, `playerIndex`, `mark`, `state`; show waiting UI if `waiting` |
| `opponent_joined` | Set `waiting` false; update `state` |
| `state` | Replace local board / turn / status from `state` |
| `player_left` | Notify user; optionally lock board |
| `error` | Show `message` |

---

## Optional (later)

**Join a specific room** (friend link):

```json
{
  "type": "join",
  "roomId": "room-uuid"
}
```

Not required for random matchmaking.
