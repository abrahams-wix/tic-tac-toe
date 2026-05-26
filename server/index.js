import http from 'http'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import express from 'express'
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

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')
const distPath = path.join(repoRoot, 'dist')
const PORT = Number(process.env.PORT) || 3046
const HOST = process.env.HOST || '0.0.0.0'

const games = new Map()
const connections = new Set()

function notifyLobby() {
  broadcastLobby(connections, games)
}

function attachGameWebSockets(server) {
  const wss = new WebSocketServer({ server })

  wss.on('connection', (socket) => {
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

  return wss
}

function createApp() {
  const app = express()

  app.get('/health', (_req, res) => {
    res.status(200).send('ok')
  })

  const hasDist = fs.existsSync(path.join(distPath, 'index.html'))
  if (hasDist) {
    app.use(express.static(distPath))
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next()
      res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) next(err)
      })
    })
  }

  return app
}

const app = createApp()
const server = http.createServer(app)
attachGameWebSockets(server)

server.listen(PORT, HOST, () => {
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'))
  const mode = hasDist ? 'HTTP + WebSocket' : 'WebSocket only (run npm run build for static UI)'
  console.log(`${mode} listening on http://${HOST}:${PORT}`)
})
