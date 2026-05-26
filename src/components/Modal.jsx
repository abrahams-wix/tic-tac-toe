import './Modal.css'

export default function Modal({ title, message, children, ariaLabel, viewport = false }) {
  return (
    <div
      className={viewport ? 'modal-overlay modal-overlay--viewport' : 'modal-overlay'}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? title}
    >
      <div className="modal-panel">
        {title && <h3 className="modal-panel__title">{title}</h3>}
        {message && <p className="modal-panel__message">{message}</p>}
        {children}
      </div>
    </div>
  )
}
