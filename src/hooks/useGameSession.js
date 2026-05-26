import { useCallback, useEffect, useRef, useState } from 'react'
import { createGameStore } from '../game/GameStore.js'
import { createModeHandler } from '../modeHandlers/createModeHandler.js'
import { GAME_MODES } from '../constants/gameModes.js'
import { getOutcome } from '../game/boardUtils.js'
import { resolveMultiplayerPhase } from '../game/multiplayerOverlay.js'
import { MULTIPLAYER_PHASE } from '../constants/multiplayerPhases.js'

export function useGameSession(mode, { consumePendingJoinRoomId } = {}) {
  const [squares, setSquares] = useState(Array(9).fill(null))
  const [turn, setTurn] = useState(0)
  const [gameStatus, setGameStatus] = useState("X's Turn")
  const [serverTurn, setServerTurn] = useState(null)
  const [multiplayerPhase, setMultiplayerPhase] = useState(null)
  const [currentRoomId, setCurrentRoomId] = useState(null)

  const modeHandlerRef = useRef(null)

  const storeRef = useRef(null)
  storeRef.current = createGameStore({
    squares,
    turn,
    serverTurn,
    setSquares,
    setTurn,
    setGameStatus,
    setServerTurn,
    onMultiplayerPhaseChange: setMultiplayerPhase,
    onRoomIdChange: setCurrentRoomId,
  })

  const outcome = getOutcome(squares)
  const gameOver =
    outcome.status === 'win' || outcome.status === 'tie' ? outcome : null

  useEffect(() => {
    modeHandlerRef.current?.destroy()
    const handler = createModeHandler(mode)
    modeHandlerRef.current = handler

    if (mode === GAME_MODES.MULTIPLAYER) {
      setSquares(Array(9).fill(null))
      setServerTurn(null)
      setMultiplayerPhase(null)
      setCurrentRoomId(null)
      setGameStatus('Connecting...')
      const joinRoomId = consumePendingJoinRoomId?.() ?? null
      handler.init(() => storeRef.current, { joinRoomId })
    } else {
      setMultiplayerPhase(null)
      setCurrentRoomId(null)
      storeRef.current.resetBoard()
      handler.init(() => storeRef.current)
    }

    return () => handler.destroy()
  }, [mode, consumePendingJoinRoomId])

  useEffect(() => {
    if (gameOver) setMultiplayerPhase(null)
  }, [gameOver])

  useEffect(() => {
    if (mode !== GAME_MODES.MULTIPLAYER || gameOver) return
    if (multiplayerPhase === MULTIPLAYER_PHASE.OPPONENT_CONNECTED) return

    const handler = modeHandlerRef.current
    if (!handler?.mark) return

    if (handler.waiting) {
      setMultiplayerPhase(MULTIPLAYER_PHASE.WAITING_OPPONENT)
      return
    }

    setMultiplayerPhase(
      resolveMultiplayerPhase({
        waiting: false,
        mark: handler.mark,
        squares,
        serverTurn,
      })
    )
  }, [mode, squares, serverTurn, gameOver, multiplayerPhase])

  function handleCellClick(index) {
    modeHandlerRef.current?.onMove(index, storeRef.current)
  }

  function handleReset() {
    modeHandlerRef.current?.onReset(storeRef.current)
  }

  const joinRoom = useCallback((roomId) => {
    modeHandlerRef.current?.joinRoom?.(roomId)
  }, [])

  const acknowledgeOpponentConnected = useCallback(() => {
    const handler = modeHandlerRef.current
    const serverState = { board: squares, turn: serverTurn }
    if (handler?.acknowledgeOpponentConnected) {
      handler.acknowledgeOpponentConnected(storeRef.current, serverState)
    } else {
      setMultiplayerPhase(
        resolveMultiplayerPhase({
          waiting: false,
          mark: handler?.mark,
          squares,
          serverTurn,
        })
      )
    }
  }, [squares, serverTurn])

  const showMultiplayerModal =
    mode === GAME_MODES.MULTIPLAYER && multiplayerPhase && !gameOver

  return {
    squares,
    gameStatus,
    gameOver,
    multiplayerPhase,
    currentRoomId,
    showMultiplayerModal,
    handleCellClick,
    handleReset,
    joinRoom,
    acknowledgeOpponentConnected,
  }
}
