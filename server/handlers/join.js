import { GameRoom } from '../gameRoom.js'
import { gameStatus } from '../protocol.js'
import {
  serverJoined,
  serverOpponentJoined,
  serverError,
  errors,
} from '../protocol.js'
import { leaveRoom } from './leaveRoom.js'

function findWaitingRoom(games) {
  for (const room of games.values()) {
    if (room.players[0] && !room.players[1]) {
      return room
    }
  }
  return null
}

function assignPlayerIndex(room) {
  if (!room.players[0]) return 0
  if (!room.players[1]) return 1
  return null
}

function notifyRoomOpponents(room, joinedPlayer) {
  for (const p of room.players) {
    if (p && p !== joinedPlayer) {
      p.send(serverOpponentJoined(room.toJSON()))
    }
  }
}

function joinPlayerToRoom(player, room, games) {
  const playerIndex = assignPlayerIndex(room)
  if (playerIndex === null) {
    player.send(serverError(errors.ROOM_FULL))
    return false
  }

  if (!room.addPlayer(player, playerIndex)) {
    player.send(serverError(errors.COULD_NOT_JOIN))
    return false
  }

  player.roomId = room.getID()
  player.playerIndex = playerIndex
  player.mark = room.getMarkForPlayer(playerIndex)

  const waiting = room.isWaitingOpponent()

  player.send(
    serverJoined({
      roomId: room.getID(),
      playerIndex,
      mark: player.mark,
      waiting,
      state: room.toJSON(),
    })
  )

  if (!waiting) {
    notifyRoomOpponents(room, player)
  }

  return true
}

export function handleJoin(player, games, roomId) {
  if (player.roomId) {
    leaveRoom(player, games)
  }

  if (roomId) {
    const room = games.get(roomId)
    if (!room) {
      player.send(serverError(errors.ROOM_NOT_FOUND))
      return
    }
    if (room.getStatus() !== gameStatus.PLAY) {
      player.send(serverError(errors.GAME_OVER))
      return
    }
    joinPlayerToRoom(player, room, games)
    return
  }

  let room = findWaitingRoom(games)
  const isNewRoom = !room

  if (isNewRoom) {
    room = new GameRoom()
    games.set(room.getID(), room)
  }

  joinPlayerToRoom(player, room, games)
}
