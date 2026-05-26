import { gameStatus, serverState, serverError, errors } from '../protocol.js'
import { broadcast } from './broadcast.js'

export function handleMove(player, games, msg) {
  if (!player.roomId) {
    player.send(serverError(errors.JOIN_FIRST))
    return
  }

  const room = games.get(player.roomId)
  if (!room) {
    player.send(serverError(errors.JOIN_FIRST))
    return
  }

  if (room.isWaitingOpponent()) {
    player.send(serverError(errors.WAITING_FOR_OPPONENT))
    return
  }

  if (player.playerIndex === null) {
    player.send(serverError(errors.JOIN_FIRST))
    return
  }

  const index = msg.index
  if (!Number.isInteger(index) || index < 0 || index > 8) {
    player.send(serverError(errors.INVALID_MOVE))
    return
  }

  if (room.getStatus() !== gameStatus.PLAY) {
    player.send(serverError(errors.GAME_OVER))
    return
  }

  if (room.turn !== player.mark) {
    player.send(serverError(errors.NOT_YOUR_TURN))
    return
  }

  const ok = room.playMoveForPlayer(index, player.playerIndex)
  if (!ok) {
    player.send(serverError(errors.INVALID_MOVE))
    return
  }

  broadcast(room, serverState(room.toJSON()))
}
