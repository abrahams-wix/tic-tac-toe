import { GameModeHandler } from './GameModeHandler.js'
import {
  WS_URL,
  messageType,
  clientJoin,
  clientMove,
} from '../protocol.js'
import { canPlayAt, makeMove } from '../game/boardUtils.js'
import { statusLabel } from '../game/statusLabels.js'
import { resolveMultiplayerPhase } from '../game/multiplayerOverlay.js'
import { MULTIPLAYER_PHASE } from '../constants/multiplayerPhases.js'

export class MultiplayerModeHandler extends GameModeHandler {
  constructor() {
    super()
    this.ws = null
    this.mark = null
    this.roomId = null
    this.waiting = true
    this.connected = false
    this.getStore = null
    this.pendingJoinRoomId = null
    this.displayName = null
  }

  init(getStore, { joinRoomId = null } = {}) {
    this.getStore = getStore
    this.pendingJoinRoomId = joinRoomId

    if (!WS_URL) {
      getStore().setStatusMessage(
        'Online play needs a game server. Set VITE_WS_URL and redeploy, or use npm run dev with npm run server.'
      )
      getStore().setMultiplayerPhase(null)
      return
    }

    this.ws = new WebSocket(WS_URL)

    this.ws.onopen = () => {
      this.connected = true
      this.sendJoin(this.pendingJoinRoomId)
      this.pendingJoinRoomId = null
    }

    this.ws.onerror = () => {
      getStore().setStatusMessage(
        'Cannot reach game server. Run npm run server locally, or set VITE_WS_URL for production.'
      )
    }

    this.ws.onmessage = (event) => {
      let msg
      try {
        msg = JSON.parse(event.data)
      } catch {
        return
      }
      this.handleMessage(msg, this.getStore())
    }

    this.ws.onclose = () => {
      this.connected = false
      this.roomId = null
      const store = this.getStore()
      store.setCurrentRoomId(null)
      store.setStatusMessage('Disconnected')
      store.setMultiplayerPhase(null)
    }

    this.addCleanup(() => {
      this.ws?.close()
      this.ws = null
    })
  }

  sendJoin(roomId) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    this.ws.send(JSON.stringify(clientJoin(roomId)))
  }

  joinRoom(roomId) {
    if (!this.connected) {
      this.pendingJoinRoomId = roomId
      return
    }
    this.sendJoin(roomId)
  }

  syncOverlay(store, serverState) {
    const squares = serverState?.board ?? store.getState().squares
    const turn = serverState?.turn ?? store.getServerTurn()

    store.setMultiplayerPhase(
      resolveMultiplayerPhase({
        waiting: this.waiting,
        mark: this.mark,
        squares,
        serverTurn: turn,
      })
    )
  }

  handleMessage(msg, store) {
    switch (msg.type) {
      case messageType.CONNECTED:
        this.displayName = msg.displayName ?? null
        store.setStatusMessage(
          this.displayName
            ? `Signed in as ${this.displayName}. Finding match...`
            : 'Finding match...'
        )
        store.setMultiplayerPhase(null)
        break

      case messageType.JOINED:
        this.mark = msg.mark
        this.roomId = msg.roomId
        store.setCurrentRoomId(msg.roomId)
        this.waiting = msg.waiting
        store.syncServerState(msg.state)
        store.setStatusMessage(
          msg.waiting ? `You are ${msg.mark}. Waiting for opponent...` : statusLabel(msg.state)
        )
        if (msg.waiting) {
          store.setMultiplayerPhase(MULTIPLAYER_PHASE.WAITING_OPPONENT)
        } else {
          this.syncOverlay(store, msg.state)
        }
        break

      case messageType.OPPONENT_JOINED:
        this.waiting = false
        store.syncServerState(msg.state)
        store.setStatusMessage(statusLabel(msg.state))
        store.setMultiplayerPhase(MULTIPLAYER_PHASE.OPPONENT_CONNECTED)
        break

      case messageType.STATE:
        store.syncServerState(msg.state)
        store.setStatusMessage(statusLabel(msg.state))
        this.syncOverlay(store, msg.state)
        break

      case messageType.PLAYER_LEFT:
        this.waiting = true
        store.syncServerState(msg.state)
        store.setStatusMessage('Opponent disconnected')
        store.setMultiplayerPhase(MULTIPLAYER_PHASE.WAITING_OPPONENT)
        break

      case messageType.ERROR:
        store.setStatusMessage(msg.message)
        store.setMultiplayerPhase(null)
        break

      default:
        break
    }
  }

  canMove(index, store) {
    if (this.inputLocked) return false
    if (!this.connected || this.waiting || !this.mark) return false

    const { squares } = store.getState()
    if (!canPlayAt(squares, index)) return false

    const serverTurn = store.getServerTurn()
    if (serverTurn && serverTurn !== this.mark) return false

    return true
  }

  onMove(index, store) {
    if (!this.canMove(index, store) || !this.ws) return

    const { squares } = store.getState()
    const board = makeMove(squares, index, this.mark)
    store.applyMove(board)

    this.afterMoveReveal(() => {
      this.ws.send(JSON.stringify(clientMove(index)))
    })
  }

  onReset(store) {
    this.clearMoveDelay()
    this.unlockInput()
    this.mark = null
    this.roomId = null
    store.setCurrentRoomId(null)
    this.waiting = true
    store.clearForMatchmaking()

    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      this.sendJoin()
      store.setStatusMessage('Finding match...')
      store.setMultiplayerPhase(MULTIPLAYER_PHASE.WAITING_OPPONENT)
    }
  }

  acknowledgeOpponentConnected(store, serverState) {
    this.syncOverlay(store, serverState)
  }
}
