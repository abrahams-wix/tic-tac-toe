# WebSocket protocol reference

This document describes the JSON message contract between the tic-tac-toe client and server. All payloads are UTF-8 JSON strings: use `JSON.stringify` when sending and `JSON.parse` when receiving.

| Item | Value |
|------|--------|
| **Transport** | WebSocket |
| **Default endpoint** | `ws://localhost:3046` |
| **Implementation** | [`protocol.js`](./protocol.js) — `messageType`, `errors`, `gameStatus`, `mark`, and `server*` / `client*` helpers |

The client imports the same constants from `src/protocol.js` (re-export of `server/protocol.js`).

---

## Design principles

- **Server authority** — The server owns room membership, turn order, and win/tie resolution for online games. Clients must not trust locally computed outcomes for multiplayer.
- **Mark assignment** — The server assigns `X` / `O` from `playerIndex`. Clients send only a cell `index` on `move`, never a mark.
- **Idempotent join** — A player already in a room who sends `join` again is removed from the current room first, then joined to the target (or matchmade).
- **Lobby fan-out** — After connect, join, move, and disconnect, the server broadcasts `rooms_snapshot` to every connected client.

---

## Shared types

### Game state (`state`)

Included in `joined`, `opponent_joined`, `state`, and `player_left`. Shape matches `GameRoom.toJSON()`.

```json
{
  "id": "room-uuid",
  "board": [null, null, null, null, null, null, null, null, null],
  "turn": "X",
  "status": "play",
  "winner": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Opaque room identifier (UUID). |
| `board` | `(null \| "X" \| "O")[]` | Nine cells, indices `0`–`8` (row-major). |
| `turn` | `"X" \| "O"` | Active player for the next legal move. |
| `status` | `"play" \| "win" \| "tie"` | Match phase. |
| `winner` | `"X" \| "O" \| null` | Set when `status` is `"win"`; otherwise `null`. |

### Lobby room entry

Sent inside `rooms_snapshot`. Shape matches `GameRoom.toLobbyJSON()`.

```json
{
  "id": "room-uuid",
  "displayName": "Crimson Apple",
  "shortId": "Crimson Apple",
  "status": "play",
  "waiting": true,
  "joinable": true,
  "turn": "X",
  "players": [
    {
      "mark": "X",
      "playerId": "player-uuid",
      "displayName": "Gold Mango",
      "label": "X · Gold Mango",
      "occupied": true
    },
    {
      "mark": "O",
      "playerId": null,
      "displayName": null,
      "label": "O · open",
      "occupied": false
    }
  ]
}
```

| Field | Description |
|-------|-------------|
| `displayName` | Human-readable room label (`<color> <fruit>`). |
| `waiting` | `true` when only one player is seated. |
| `joinable` | `true` when the room accepts a second player (`waiting` and `status === "play"`). |

### Error

Returned for invalid JSON, unknown `type`, failed join, or rejected move.

```json
{
  "type": "error",
  "message": "Human-readable reason"
}
```

Common `message` values are defined in `errors` in [`protocol.js`](./protocol.js) (for example, `Room not found`, `Not your turn`, `Game is over`).

---

## Client → server messages

### `join`

Enter matchmaking or join a specific room.

**Matchmaking** (no `roomId`):

```json
{
  "type": "join"
}
```

The server places the player in the first room with one vacant seat, or creates a new room.

**Targeted join**:

```json
{
  "type": "join",
  "roomId": "room-uuid"
}
```

Fails with `error` if the room does not exist, is full, or the game is no longer in `"play"`.

### `move`

Submit a move for the authenticated player’s mark.

```json
{
  "type": "move",
  "index": 4
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `index` | `number` | Integer `0`–`8` |

Preconditions: player is in a room, `waiting` is `false`, `state.status` is `"play"`, and it is the player’s turn.

---

## Server → client messages

### `connected`

Sent immediately after the WebSocket handshake. The player is not in a room yet.

```json
{
  "type": "connected",
  "playerId": "player-uuid",
  "displayName": "Silver Peach"
}
```

| Field | Description |
|-------|-------------|
| `playerId` | Opaque connection identity (UUID). |
| `displayName` | Assigned display name for this session. |

**Client action:** Open a game connection flow or lobby-only listener; send `join` when entering online play.

---

### `joined`

Acknowledges successful room assignment.

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

| Field | Type | Description |
|-------|------|-------------|
| `roomId` | `string` | Room the player joined. |
| `playerIndex` | `0 \| 1` | Seat index. |
| `mark` | `"X" \| "O"` | `X` for index `0`, `O` for index `1`. |
| `waiting` | `boolean` | `true` until a second player joins. |
| `state` | `object` | Current game state (see above). |

---

### `opponent_joined`

Sent to the player who was waiting when a second player joins.

```json
{
  "type": "opponent_joined",
  "waiting": false,
  "state": { }
}
```

Both players may send `move` once `waiting` is `false`.

---

### `state`

Broadcast to all players in the room after a valid move.

```json
{
  "type": "state",
  "state": { }
}
```

Replace local board, turn, and outcome from `state`.

---

### `player_left`

Sent when the other player disconnects.

```json
{
  "type": "player_left",
  "playerIndex": 0,
  "state": { }
}
```

The vacated seat is cleared in `state`. The remaining client typically shows a waiting state until the opponent rejoins or the user leaves.

---

### `rooms_snapshot`

Lobby update broadcast to **every** connected client (including lobby-only connections).

```json
{
  "type": "rooms_snapshot",
  "rooms": [ ]
}
```

`rooms` is an array of lobby room entries (see above). Emitted on connect, join, move, and disconnect.

---

## Session lifecycle

```
Client                          Server
  | open                           |
  |<──────── connected ────────────|
  |<──────── rooms_snapshot ───────|  (all connections)
  |──────── join ─────────────────>|
  |<──────── joined ───────────────|
  |<──────── rooms_snapshot ───────|  (all connections)
  |                                |  (second client joins)
  |<──────── opponent_joined ──────|  (waiting client)
  |──────── move { index } ───────>|
  |<──────── state ────────────────|  (both clients in room)
  |<──────── rooms_snapshot ───────|  (all connections)
  | close                          |
  |              player_left ─────>|  (peer in room)
  |<──────── rooms_snapshot ───────|  (all connections)
```

---

## Client handler checklist

| `type` | Recommended handling |
|--------|----------------------|
| `connected` | Store `playerId` and `displayName`; optionally auto-send `join`. |
| `joined` | Store `roomId`, `playerIndex`, `mark`, and `state`; show waiting UI when `waiting` is `true`. |
| `opponent_joined` | Set `waiting` to `false`; sync `state`; prompt user to start play. |
| `state` | Replace board, turn, status, and winner from `state`. |
| `player_left` | Notify user; sync `state`; return to waiting UI if applicable. |
| `rooms_snapshot` | Update lobby / room list UI. |
| `error` | Surface `message`; do not assume partial state updates. |

---

## Error catalog

Defined in `errors` in [`protocol.js`](./protocol.js):

| Message | Typical cause |
|---------|----------------|
| `Invalid JSON` | Malformed payload |
| `Unknown message type` | Unsupported `type` field |
| `Room not found` | `join` with unknown `roomId` |
| `Room is full` | No vacant seat |
| `Could not join room` | Internal join failure |
| `Join a room first` | `move` before `join` |
| `Waiting for opponent` | `move` while alone in room |
| `Invalid move` | Out-of-range index or occupied cell |
| `Not your turn` | Move on wrong turn |
| `Game is over` | Move after win or tie |

---

## Versioning

The protocol is not versioned in the wire format. Breaking changes should be coordinated with client and server deployments together. Document new message types or fields in this file when they are added.
