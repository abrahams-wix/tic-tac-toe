import { GameModeHandler } from './GameModeHandler.js'
import { canPlayAt, makeMove, markForTurn, nextTurn } from '../game/boardUtils.js'

export class LocalModeHandler extends GameModeHandler {
  canMove(index, store) {
    if (this.inputLocked) return false
    const { squares } = store.getState()
    return canPlayAt(squares, index)
  }

  onMove(index, store) {
    if (!this.canMove(index, store)) return

    const { squares, turn } = store.getState()
    const board = makeMove(squares, index, markForTurn(turn))
    const status = store.applyMove(board)
    if (status !== 'play') return

    this.afterMoveReveal(() => {
      store.setTurnForNextPlayer(nextTurn(turn))
    })
  }

  onReset(store) {
    this.clearMoveDelay()
    this.unlockInput()
    store.resetBoard()
  }
}
