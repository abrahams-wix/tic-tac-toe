/** WebSocket protocol — types, errors, and message builders. See messages.md */

export const WS_URL = 'ws://localhost:3046'

/** Message `type` strings */
export const messageType = {
  // server → client
  CONNECTED: 'connected',
  JOINED: 'joined',
  OPPONENT_JOINED: 'opponent_joined',
  STATE: 'state',
  PLAYER_LEFT: 'player_left',
  ROOMS_SNAPSHOT: 'rooms_snapshot',
  ERROR: 'error',

  // client → server
  JOIN: 'join',
  MOVE: 'move',
}

/** Board / game status values (matches GameRoom.toJSON().status) */
export const gameStatus = {
  PLAY: 'play',
  WIN: 'win',
  TIE: 'tie',
}

/** Player marks */
export const mark = {
  X: 'X',
  O: 'O',
}

/** Server error messages */
export const errors = {
  INVALID_JSON: 'Invalid JSON',
  UNKNOWN_TYPE: 'Unknown message type',
  ALREADY_IN_ROOM: 'Already in a room',
  ROOM_FULL: 'Room is full',
  ROOM_NOT_FOUND: 'Room not found',
  COULD_NOT_JOIN: 'Could not join room',
  JOIN_FIRST: 'Join a room first',
  WAITING_FOR_OPPONENT: 'Waiting for opponent',
  INVALID_MOVE: 'Invalid move',
  NOT_YOUR_TURN: 'Not your turn',
  GAME_OVER: 'Game is over',
}

/** @typedef {(null | 'X' | 'O')[]} BoardCells */

/**
 * @typedef {Object} GameState
 * @property {string} id
 * @property {BoardCells} board
 * @property {'X' | 'O'} turn
 * @property {string} status
 * @property {null | 'X' | 'O'} winner
 */

// --- client → server ---

/** @param {string} [roomId] */
export function clientJoin(roomId) {
  const msg = { type: messageType.JOIN }
  if (roomId) msg.roomId = roomId
  return msg
}

/** @param {number} index 0–8 */
export function clientMove(index) {
  return { type: messageType.MOVE, index }
}

// --- server → client ---

/**
 * @param {string} playerId
 * @param {string} displayName
 */
export function serverConnected(playerId, displayName) {
  return { type: messageType.CONNECTED, playerId, displayName }
}

/**
 * @param {Object} params
 * @param {string} params.roomId
 * @param {number} params.playerIndex
 * @param {'X' | 'O'} params.mark
 * @param {boolean} params.waiting
 * @param {GameState} params.state
 */
export function serverJoined({ roomId, playerIndex, mark, waiting, state }) {
  return {
    type: messageType.JOINED,
    roomId,
    playerIndex,
    mark,
    waiting,
    state,
  }
}

/** @param {GameState} state */
export function serverOpponentJoined(state) {
  return {
    type: messageType.OPPONENT_JOINED,
    waiting: false,
    state,
  }
}

/** @param {GameState} state */
export function serverState(state) {
  return { type: messageType.STATE, state }
}

/**
 * @param {number} playerIndex
 * @param {GameState} state
 */
export function serverPlayerLeft(playerIndex, state) {
  return {
    type: messageType.PLAYER_LEFT,
    playerIndex,
    state,
  }
}

/** @param {object[]} rooms */
export function serverRoomsSnapshot(rooms) {
  return { type: messageType.ROOMS_SNAPSHOT, rooms }
}

/** @param {string} message */
export function serverError(message) {
  return { type: messageType.ERROR, message }
}

export function parseMessage(raw) {
  try {
    return JSON.parse(raw.toString())
  } catch {
    return null
  }
}