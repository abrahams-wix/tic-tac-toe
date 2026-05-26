import BoardCell from './BoardCell.jsx'
import GameOverModal from './GameOverModal.jsx'
import MultiplayerStatusModal from './MultiplayerStatusModal.jsx'
import './GameBoard.css'

export default function GameBoard({
  squares,
  gameStatus,
  gameOver,
  multiplayerPhase,
  showMultiplayerModal,
  onCellClick,
  onReset,
  onAcknowledgeOpponentConnected,
}) {
  return (
    <section className="game-board" aria-label="Tic-tac-toe board">
      <h1 className="game-board__title">Tic-Tac-Toe</h1>
      <p className="game-board__status" role="status">
        {gameStatus}
      </p>
      <div className="game-board__grid">
        <div className="game-board__row">
          <BoardCell value={squares[0]} onCellClick={() => onCellClick(0)} />
          <BoardCell value={squares[1]} onCellClick={() => onCellClick(1)} />
          <BoardCell value={squares[2]} onCellClick={() => onCellClick(2)} />
        </div>
        <div className="game-board__row">
          <BoardCell value={squares[3]} onCellClick={() => onCellClick(3)} />
          <BoardCell value={squares[4]} onCellClick={() => onCellClick(4)} />
          <BoardCell value={squares[5]} onCellClick={() => onCellClick(5)} />
        </div>
        <div className="game-board__row">
          <BoardCell value={squares[6]} onCellClick={() => onCellClick(6)} />
          <BoardCell value={squares[7]} onCellClick={() => onCellClick(7)} />
          <BoardCell value={squares[8]} onCellClick={() => onCellClick(8)} />
        </div>
      </div>
      <button type="button" className="game-board__reset" onClick={onReset}>
        Reset
      </button>

      {gameOver && <GameOverModal outcome={gameOver} onPlayAgain={onReset} />}
      {showMultiplayerModal && (
        <MultiplayerStatusModal
          phase={multiplayerPhase}
          onContinue={onAcknowledgeOpponentConnected}
        />
      )}
    </section>
  )
}
