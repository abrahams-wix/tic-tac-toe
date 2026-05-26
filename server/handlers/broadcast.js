export function broadcast(room, payload, except = null) {
  for (const p of room.players) {
    if (p && p !== except && p.isConnected) {
      p.send(payload)
    }
  }
}
