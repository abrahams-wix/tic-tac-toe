import { WebSocketServer } from 'ws'
import { Player } from './player.js'
import {
  serverConnected,
  serverError,
  parseMessage,
  errors,
  messageType,
} from './protocol.js'
import { handleJoin } from './handlers/join.js'
import { handleMove } from './handlers/move.js'
import { handleDisconnect } from './handlers/disconnect.js'
import { broadcastLobby } from './lobby.js'

const PORT = Number(process.env.PORT) || 3046

const gameServer = new WebSocketServer({ port: PORT })
const games = new Map()
const connections = new Set()

function notifyLobby() {
  broadcastLobby(connections, games)
}

gameServer.on('connection', (socket) => {
  const player = new Player(socket)
  connections.add(player)

  player.send(serverConnected(player.id, player.displayName))
  notifyLobby()

  player.on('message', (raw) => {
    const msg = parseMessage(raw)

    if (!msg) {
      player.send(serverError(errors.INVALID_JSON))
      return
    }

    if (msg.type === messageType.JOIN) {
      handleJoin(player, games, msg.roomId)
      notifyLobby()
      return
    }

    if (msg.type === messageType.MOVE) {
      handleMove(player, games, msg)
      notifyLobby()
      return
    }

    player.send(serverError(errors.UNKNOWN_TYPE))
  })

  player.on('close', () => {
    handleDisconnect(player, games)
    connections.delete(player)
    notifyLobby()
  })
})

console.log(`WebSocket server running at ws://localhost:${PORT}`)
