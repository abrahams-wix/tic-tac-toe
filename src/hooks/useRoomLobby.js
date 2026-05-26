import { useEffect, useRef, useState } from 'react'
import { WS_URL, messageType } from '../protocol.js'

/** Live room list for all modes — separate lightweight WebSocket. */
export function useRoomLobby() {
  const [rooms, setRooms] = useState([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)

  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)

    ws.onmessage = (event) => {
      let msg
      try {
        msg = JSON.parse(event.data)
      } catch {
        return
      }
      if (msg.type === messageType.ROOMS_SNAPSHOT) {
        setRooms(msg.rooms ?? [])
      }
    }

    ws.onclose = () => {
      setConnected(false)
      setRooms([])
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [])

  return { rooms, connected }
}
