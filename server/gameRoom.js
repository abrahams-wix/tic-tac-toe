import crypto from 'crypto'
import { gameStatus as status } from './protocol.js'
import { randomDisplayName } from './nameDictionary.js'

export { gameStatus as status } from './protocol.js'

export class GameRoom {
  constructor() {
    this.id = crypto.randomUUID()
    this.displayName = randomDisplayName()
    this.board = new Board() 
    this.turn = 'X'; 
    this.players = [null, null]; 
  }

  getID() {
    return this.id
  }

  getStatus() {
    return this.board.getStatus()
  }

  isWaitingOpponent(){
    return !this.players[1];
  }

  getMarkForPlayer(playerIndex) {
    return playerIndex === 0 ? 'X' : 'O'
  }

  addPlayer(player, playerIndex) {
    if (playerIndex < 0 || playerIndex > 1) return false
    if (this.players[playerIndex]) return false
    this.players[playerIndex] = player
    return true
  }

  toggleTurn() {
    this.turn = this.turn === 'X' ? 'O' : 'X'
    return this.turn
  }

  playMove(index, mark) {
    if (this.board.getStatus() !== status.PLAY) return false
    if (mark !== this.turn) return false
    if (!this.board.makeMove(index, mark)) return false

    this.board.updateStatus()

    if (this.board.getStatus() === status.PLAY) {
      this.toggleTurn()
    }

    return true
  }

  playMoveForPlayer(boardIndex, playerIndex) {
    return this.playMove(boardIndex, this.getMarkForPlayer(playerIndex))
  }

  toJSON() {
    return {
      id: this.id,
      board: this.board.board,
      turn: this.turn,
      status: this.board.getStatus(),
      winner: this.board.getWinner(),
    }
  }

  toLobbyJSON() {
    const describeSlot = (playerIndex) => {
      const mark = this.getMarkForPlayer(playerIndex)
      const player = this.players[playerIndex]
      return {
        mark,
        playerId: player?.id ?? null,
        displayName: player?.displayName ?? null,
        label: player ? `${mark} · ${player.displayName}` : `${mark} · open`,
        occupied: Boolean(player),
      }
    }

    const boardStatus = this.board.getStatus()
    const waiting = this.isWaitingOpponent()

    return {
      id: this.id,
      displayName: this.displayName,
      shortId: this.displayName,
      status: boardStatus,
      waiting,
      joinable: waiting && boardStatus === status.PLAY,
      turn: this.turn,
      players: [describeSlot(0), describeSlot(1)],
    }
  }
}

export class Board {
  constructor() {
    this.board = Array(9).fill(null)
    this.status = status.PLAY
  }

  makeMove(index, mark) {
    if (index < 0 || index > 8) return false
    if (this.board[index] != null) return false
    this.board[index] = mark
    return true
  }

  updateStatus() {
    if (this.getWinner()) {
      this.status = status.WIN
    } else if (this.isTie()) {
      this.status = status.TIE
    } else {
      this.status = status.PLAY
    }
  }

  getStatus() {
    return this.status
  }

  getWinner() {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ]

    for (const [a, b, c] of lines) {
      if (
        this.board[a] &&
        this.board[a] === this.board[b] &&
        this.board[b] === this.board[c]
      ) {
        return this.board[a]
      }
    }

    return null
  }

  isTie() {
    return (
      !this.getWinner() && this.board.every((cell) => cell != null)
    )
  }
}
