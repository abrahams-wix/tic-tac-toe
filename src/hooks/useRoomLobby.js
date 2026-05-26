import { useEffect, useRef, useState } from 'react'
import { WS_URL, WS_CONFIGURED, messageType } from '../protocol.js'

/** Live room list for all modes — separate lightweight WebSocket. */
export function useRoomLobby() {
  const [rooms, setRooms] = useState([])
  const [connected, setConnected] = useState(false)
  const [connectionFailed, setConnectionFailed] = useState(false)
  const wsRef = useRef(null)

  useEffect(() => {
    if (!WS_URL) return undefined

    setConnectionFailed(false)
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setConnectionFailed(false)
    }

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

    ws.onerror = () => {
      setConnectionFailed(true)
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

  return {
    rooms,
    connected,
    wsConfigured: WS_CONFIGURED,
    connectionFailed,
  }
}
