import { useEffect } from 'react'
import Modal from './Modal.jsx'
import {
  MULTIPLAYER_PHASE,
  MULTIPLAYER_PHASE_COPY,
} from '../constants/multiplayerPhases.js'

export default function MultiplayerStatusModal({ phase, onContinue }) {
  const copy = MULTIPLAYER_PHASE_COPY[phase]
  const showContinue = phase === MULTIPLAYER_PHASE.OPPONENT_CONNECTED

  useEffect(() => {
    if (phase !== MULTIPLAYER_PHASE.OPPONENT_CONNECTED) return undefined
    const timer = setTimeout(onContinue, 2000)
    return () => clearTimeout(timer)
  }, [phase, onContinue])

  if (!copy) return null

  return (
    <Modal title={copy.title} message={copy.message} ariaLabel={copy.title}>
      {showContinue && (
        <div className="modal-panel__actions">
          <button
            type="button"
            className="modal-panel__button modal-panel__button--primary"
            onClick={onContinue}
          >
            Let&apos;s go
          </button>
        </div>
      )}
    </Modal>
  )
}
