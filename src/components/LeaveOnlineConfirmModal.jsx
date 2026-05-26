import Modal from './Modal.jsx'

export default function LeaveOnlineConfirmModal({ targetLabel, onConfirm, onCancel }) {
  return (
    <Modal
      viewport
      title="Leave online game?"
      message="Switching modes will disconnect you from your current match. Your opponent will be notified."
      ariaLabel="Confirm leaving online game"
    >
      <div className="modal-panel__actions">
        <button type="button" className="modal-panel__button" onClick={onCancel}>
          Stay online
        </button>
        <button
          type="button"
          className="modal-panel__button modal-panel__button--primary"
          onClick={onConfirm}
        >
          Switch to {targetLabel}
        </button>
      </div>
    </Modal>
  )
}
