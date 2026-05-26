import { getOutcome } from './boardUtils.js'
import { statusLabel } from './statusLabels.js'
import { gameStatus } from '../protocol.js'

function moveStatusFromBoard(board) {
  const outcome = getOutcome(board)
  if (outcome.status === 'win') return 'win'
  if (outcome.status === 'tie') return 'tie'
  return 'play'
}


export function createGameStore(deps) {
  const {
    squares,
    turn,
    serverTurn,
    setSquares,
    setTurn,
    setGameStatus,
    setServerTurn,
    onMultiplayerPhaseChange,
    onRoomIdChange,
  } = deps

  return {
    getState: () => ({ squares, turn }),
    getOutcome,
    getServerTurn: () => serverTurn,

    applyMove(board) {
      setSquares(board)
      const status = moveStatusFromBoard(board)
      if (status === 'win') {
        const { winner } = getOutcome(board)
        setGameStatus(`${winner} Wins!`)
      } else if (status === 'tie') {
        setGameStatus('Tie!')
      }
      return status
    },

    setTurnForNextPlayer(nextTurn) {
      setTurn(nextTurn)
      setGameStatus(statusLabel({ status: 'play', turn: nextTurn }))
    },

    updateTurn(nextTurn, statusMessage) {
      setTurn(nextTurn)
      setGameStatus(statusMessage)
    },

    setStatusMessage: setGameStatus,

    syncServerState(state) {
      setSquares([...state.board])
      setServerTurn(state.turn)
      if (state.status !== gameStatus.PLAY) {
        setGameStatus(statusLabel(state))
      }
    },

    resetBoard() {
      setSquares(Array(9).fill(null))
      setTurn(0)
      setServerTurn(null)
      setGameStatus("X's Turn")
    },

    clearForMatchmaking() {
      setSquares(Array(9).fill(null))
      setServerTurn(null)
      onMultiplayerPhaseChange?.(null)
    },

    setMultiplayerPhase(phase) {
      onMultiplayerPhaseChange?.(phase)
    },

    setCurrentRoomId(roomId) {
      onRoomIdChange?.(roomId)
    },
  }
}
