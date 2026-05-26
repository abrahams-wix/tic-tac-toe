export const MULTIPLAYER_PHASE = Object.freeze({
  WAITING_OPPONENT: 'waiting_opponent',
  OPPONENT_CONNECTED: 'opponent_connected',
  WAITING_OPPONENT_MOVE: 'waiting_opponent_move',
})

export const MULTIPLAYER_PHASE_COPY = Object.freeze({
  [MULTIPLAYER_PHASE.WAITING_OPPONENT]: {
    title: 'Waiting for opponent',
    message: 'You are in the queue. Another player will join soon.',
  },
  [MULTIPLAYER_PHASE.OPPONENT_CONNECTED]: {
    title: 'Opponent connected',
    message: 'Your match is ready. Good luck!',
  },
  [MULTIPLAYER_PHASE.WAITING_OPPONENT_MOVE]: {
    title: "Opponent's turn",
    message: 'Waiting for your opponent to move…',
  },
})
