import type { RefObject } from 'react'
import {
  keyboardBaseNotes,
  type KeyboardBaseNote,
} from '../input/keyboardMapper'
import Modal from './Modal'

interface KeyboardBaseModalProps {
  isOpen: boolean
  keyboardBaseNote: KeyboardBaseNote
  anchorRef: RefObject<HTMLElement | null>
  onClose: () => void
  onKeyboardBaseNoteChange: (baseNote: KeyboardBaseNote) => void
}

function KeyboardBaseModal({
  isOpen,
  keyboardBaseNote,
  anchorRef,
  onClose,
  onKeyboardBaseNoteChange,
}: KeyboardBaseModalProps) {
  function handleBaseNoteChange(baseNote: KeyboardBaseNote) {
    onKeyboardBaseNoteChange(baseNote)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Keyboard Mapping"
      anchorRef={anchorRef}
      placement="top"
      onClose={onClose}
    >
      <div
        className="keyboard-base-option-list"
        role="radiogroup"
        aria-label="Keyboard mapping base note"
      >
        {keyboardBaseNotes.map(baseNote => (
          <button
            key={baseNote}
            className="app-button app-button--compact keyboard-base-option"
            type="button"
            aria-pressed={keyboardBaseNote === baseNote}
            data-active={keyboardBaseNote === baseNote}
            onClick={() => handleBaseNoteChange(baseNote)}
          >
            {baseNote}
          </button>
        ))}
      </div>
    </Modal>
  )
}

export default KeyboardBaseModal
