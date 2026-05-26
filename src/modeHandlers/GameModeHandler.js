import { MOVE_REVEAL_DELAY_MS } from '../constants/timing.js'

export class GameModeHandler {
  constructor() {
    this.cleanupFns = []
    this.moveDelayId = null
    this.inputLocked = false
  }

  canMove(_index, _store) {
    return false
  }

  init(_getStore, _options) {}

  joinRoom(_roomId) {}

  onMove(_index, _store) {}

  onReset(_store) {}

  acknowledgeOpponentConnected(_store, _serverState) {}

  lockInput() {
    this.inputLocked = true
  }

  unlockInput() {
    this.inputLocked = false
  }

  clearMoveDelay() {
    if (this.moveDelayId != null) {
      clearTimeout(this.moveDelayId)
      this.moveDelayId = null
    }
  }

  afterMoveReveal(fn) {
    this.clearMoveDelay()
    this.lockInput()
    this.moveDelayId = setTimeout(() => {
      this.moveDelayId = null
      fn()
      this.unlockInput()
    }, MOVE_REVEAL_DELAY_MS)
  }

  destroy() {
    this.clearMoveDelay()
    this.unlockInput()
    for (const fn of this.cleanupFns) fn()
    this.cleanupFns = []
  }

  addCleanup(fn) {
    this.cleanupFns.push(fn)
  }
}
