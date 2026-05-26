import { getOutcome } from './boardUtils.js'
import { MULTIPLAYER_PHASE } from '../constants/multiplayerPhases.js'

/** Pick the correct multiplayer status overlay for the current match. */
export function resolveMultiplayerPhase({ waiting, mark, squares, serverTurn }) {
  const outcome = getOutcome(squares)
  if (outcome.status !== 'play') return null

  if (waiting || !mark) {
    return MULTIPLAYER_PHASE.WAITING_OPPONENT
  }

  if (serverTurn && serverTurn !== mark) {
    return MULTIPLAYER_PHASE.WAITING_OPPONENT_MOVE
  }

  return null
}
