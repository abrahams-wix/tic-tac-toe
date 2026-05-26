import './RoomQueue.css'

function statusLabel(status) {
  if (status === 'win') return 'Finished'
  if (status === 'tie') return 'Tie'
  return 'In play'
}

export default function RoomQueue({
  rooms,
  connected,
  currentRoomId,
  isOnline,
  onJoinRoom,
}) {
  return (
    <aside className="room-queue" aria-label="Live game rooms">
      <h2 className="room-queue__title">Live rooms</h2>
      <p className="room-queue__hint">
        {connected
          ? 'Who is in each room right now'
          : 'Connecting to server…'}
      </p>

      {rooms.length === 0 ? (
        <p className="room-queue__empty">No active rooms</p>
      ) : (
        <ul className="room-queue__list">
          {rooms.map((room) => {
            const isCurrentRoom = room.id === currentRoomId
            const canJoin = room.joinable && !isCurrentRoom

            return (
              <li key={room.id} className="room-queue__card">
                <div className="room-queue__card-header">
                  <span className="room-queue__room-id">{room.displayName ?? room.shortId}</span>
                  <span className={`room-queue__badge room-queue__badge--${room.status}`}>
                    {statusLabel(room.status)}
                  </span>
                </div>
                {room.waiting && (
                  <p className="room-queue__waiting">Waiting for opponent</p>
                )}
                <ul className="room-queue__players">
                  {room.players.map((slot) => (
                    <li
                      key={slot.mark}
                      className={
                        slot.occupied
                          ? 'room-queue__player'
                          : 'room-queue__player room-queue__player--open'
                      }
                    >
                      {slot.label}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="room-queue__join"
                  disabled={!canJoin}
                  onClick={() => onJoinRoom(room.id)}
                >
                  {isCurrentRoom ? 'Your room' : canJoin ? 'Join room' : 'Unavailable'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}
