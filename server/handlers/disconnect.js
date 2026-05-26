import { leaveRoom } from './leaveRoom.js'

export function handleDisconnect(player, games) {
  leaveRoom(player, games)
}
