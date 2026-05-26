import { serverPlayerLeft } from '../protocol.js'
import { broadcast } from './broadcast.js'

/** Remove a player from their room and tear down the room. */
export function leaveRoom(player, games) {
  if (!player.roomId || player.playerIndex === null) return

  const room = games.get(player.roomId)
  const playerIndex = player.playerIndex

  player.roomId = null
  player.playerIndex = null
  player.mark = null

  if (!room) return

  room.players[playerIndex] = null

  broadcast(room, serverPlayerLeft(playerIndex, room.toJSON()), player)

  for (const p of room.players) {
    if (p) {
      p.roomId = null
      p.playerIndex = null
      p.mark = null
    }
  }

  games.delete(room.getID())
}
