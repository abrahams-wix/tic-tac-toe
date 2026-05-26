import { GameModeHandler } from './GameModeHandler.js'
import { canPlayAt, makeMove, getLegalMoves } from '../game/boardUtils.js'
const CPU_DELAY_MS = 2000
const HUMAN_TURN = 0

export class CpuModeHandler extends GameModeHandler {
  constructor() {
    super()
    this.cpuTimeoutId = null
  }

  canMove(index, store) {
    if (this.inputLocked) return false
    const { squares, turn } = store.getState()
    if (turn !== HUMAN_TURN) return false
    return canPlayAt(squares, index)
  }

  onMove(index, store) {
    if (!this.canMove(index, store)) return

    const { squares } = store.getState()
    const boardAfterX = makeMove(squares, index, 'X')
    const status = store.applyMove(boardAfterX)
    if (status !== 'play') return

    this.afterMoveReveal(() => {
      store.updateTurn(1, 'CPU is thinking...')
      this.cpuTimeoutId = setTimeout(() => {
        this.cpuTimeoutId = null
        this.playCpuMove(boardAfterX, store)
      }, CPU_DELAY_MS)
    })
  }

  playCpuMove(boardAfterX, store) {
    const moves = getLegalMoves(boardAfterX)
    if (moves.length === 0) return

    const pick = moves[Math.floor(Math.random() * moves.length)]
    const boardAfterO = makeMove(boardAfterX, pick, 'O')
    const status = store.applyMove(boardAfterO)
    if (status === 'play') store.setTurnForNextPlayer(0)
  }

  onReset(store) {
    this.clearMoveDelay()
    if (this.cpuTimeoutId != null) {
      clearTimeout(this.cpuTimeoutId)
      this.cpuTimeoutId = null
    }
    this.unlockInput()
    store.resetBoard()
  }

  destroy() {
    if (this.cpuTimeoutId != null) clearTimeout(this.cpuTimeoutId)
    super.destroy()
  }
}
