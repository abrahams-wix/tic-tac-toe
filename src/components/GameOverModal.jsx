import Modal from './Modal.jsx'

export default function GameOverModal({ outcome, onPlayAgain }) {
  const isWin = outcome.status === 'win'
  const isTie = outcome.status === 'tie'

  return (
    <Modal
      title={isWin ? 'Game over' : 'Draw'}
      ariaLabel={isWin ? `${outcome.winner} wins` : 'Game tied'}
    >
      {isWin && (
        <p
          className={`modal-panel__winner modal-panel__winner--${outcome.winner.toLowerCase()}`}
        >
          {outcome.winner}
        </p>
      )}
      <p className="modal-panel__message">
        {isWin ? `${outcome.winner} wins the game!` : 'No winner this round.'}
      </p>
      <div className="modal-panel__actions">
        <button
          type="button"
          className="modal-panel__button modal-panel__button--primary"
          onClick={onPlayAgain}
        >
          Play again
        </button>
      </div>
    </Modal>
  )
}
