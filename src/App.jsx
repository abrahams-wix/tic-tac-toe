import { useCallback, useRef, useState } from 'react'
import GameBoard from './components/GameBoard'
import RoomQueue from './components/RoomQueue.jsx'
import LeaveOnlineConfirmModal from './components/LeaveOnlineConfirmModal.jsx'
import { useGameSession } from './hooks/useGameSession.js'
import { useRoomLobby } from './hooks/useRoomLobby.js'
import { GAME_MODES, GAME_MODE_OPTIONS } from './constants/gameModes.js'
import './App.css'

function App() {
  const [gameMode, setGameMode] = useState(GAME_MODES.CPU)
  const [pendingMode, setPendingMode] = useState(null)
  const pendingJoinRoomId = useRef(null)
  const { rooms, connected } = useRoomLobby()

  const consumePendingJoinRoomId = useCallback(() => {
    const id = pendingJoinRoomId.current
    pendingJoinRoomId.current = null
    return id
  }, [])

  const session = useGameSession(gameMode, { consumePendingJoinRoomId })
  const isOnline = gameMode === GAME_MODES.MULTIPLAYER

  const pendingModeLabel = GAME_MODE_OPTIONS.find((o) => o.mode === pendingMode)?.label

  function handleModeSelect(nextMode) {
    if (nextMode === gameMode) return

    if (gameMode === GAME_MODES.MULTIPLAYER && nextMode !== GAME_MODES.MULTIPLAYER) {
      setPendingMode(nextMode)
      return
    }

    setGameMode(nextMode)
  }

  function handleJoinRoom(roomId) {
    if (gameMode === GAME_MODES.MULTIPLAYER) {
      session.joinRoom(roomId)
      return
    }

    pendingJoinRoomId.current = roomId
    setGameMode(GAME_MODES.MULTIPLAYER)
  }

  function confirmLeaveOnline() {
    if (pendingMode) setGameMode(pendingMode)
    setPendingMode(null)
  }

  function cancelLeaveOnline() {
    setPendingMode(null)
  }

  return (
    <div className="app-shell">
      <div className="app-main">
        <div className="mode-picker">
          {GAME_MODE_OPTIONS.map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              className={gameMode === mode ? 'active' : ''}
              onClick={() => handleModeSelect(mode)}
            >
              {label}
            </button>
          ))}
        </div>
        <GameBoard
          squares={session.squares}
          gameStatus={session.gameStatus}
          gameOver={session.gameOver}
          multiplayerPhase={session.multiplayerPhase}
          showMultiplayerModal={session.showMultiplayerModal}
          onCellClick={session.handleCellClick}
          onReset={session.handleReset}
          onAcknowledgeOpponentConnected={session.acknowledgeOpponentConnected}
        />
      </div>

      <RoomQueue
        rooms={rooms}
        connected={connected}
        currentRoomId={session.currentRoomId}
        isOnline={isOnline}
        onJoinRoom={handleJoinRoom}
      />

      {pendingMode && (
        <LeaveOnlineConfirmModal
          targetLabel={pendingModeLabel}
          onConfirm={confirmLeaveOnline}
          onCancel={cancelLeaveOnline}
        />
      )}
    </div>
  )
}

export default App
