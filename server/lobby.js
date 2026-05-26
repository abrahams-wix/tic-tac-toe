import { serverRoomsSnapshot } from './protocol.js'

export function getLobbySnapshot(games) {
  return [...games.values()].map((room) => room.toLobbyJSON())
}

export function broadcastLobby(connections, games) {
  const payload = serverRoomsSnapshot(getLobbySnapshot(games))
  for (const player of connections) {
    if (player.isConnected) player.send(payload)
  }
}
