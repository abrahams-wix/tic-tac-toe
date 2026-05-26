import crypto from 'crypto'
import { randomDisplayName } from './nameDictionary.js'

export class Player {
  constructor(socket) {
    this.socket = socket
    this.id = crypto.randomUUID()
    this.displayName = randomDisplayName()
    this.playerIndex = null
    this.mark = null
    this.roomId = null
  }

  send(payload) {
    if (this.socket.readyState === 1) {
      this.socket.send(JSON.stringify(payload))
    }
  }

  get isConnected() {
    return this.socket.readyState === 1
  }

  on(event, handler) {
    this.socket.on(event, handler)
  }

  close() {
    this.socket.close()
  }
}
