import { useRef, useState, type RefObject } from 'react'
import type { PianoLabelMode } from '../data/piano'
import {
  keyboardRangeLabel,
  shiftKeyboardBaseNote,
  type KeyboardBaseNote,
} from '../input/keyboardMapper'
import type { InputConnectionState } from './InputDeviceButton'
import KeyboardBaseModal from './KeyboardBaseModal'
import KeyLabelsModal from './KeyLabelsModal'
import Piano from './Piano'

interface InputPianoDockProps {
  pressedNotes: string[]
  labelMode: PianoLabelMode
  onLabelModeChange: (mode: PianoLabelMode) => void
  soundEnabled: boolean
  onSoundChange: (enabled: boolean) => void
  onPress: (noteName: string) => void
  onRelease: (noteName: string) => void
  keyboardBaseNote: KeyboardBaseNote
  onKeyboardBaseNoteChange: (baseNote: KeyboardBaseNote) => void
  midiButtonRef: RefObject<HTMLButtonElement | null>
  midiConnectionState: InputConnectionState
  bluetoothConnectionState: InputConnectionState
  onMidiConnect: () => void
  keyDockCollapsed: boolean
  onKeyDockCollapsedChange: (collapsed: boolean) => void
}

function labelModeText(labelMode: PianoLabelMode) {
  switch (labelMode) {
    case 'hidden':
      return 'Hidden'
    case 'white':
      return 'White Keys'
    case 'letter':
    case 'c':
      return 'Letter'
    case 'solfege':
      return 'Solfege'
    default:
      return 'All'
  }
}

function InputPianoDock({
  pressedNotes,
  labelMode,
  onLabelModeChange,
  soundEnabled,
  onSoundChange,
  onPress,
  onRelease,
  keyboardBaseNote,
  onKeyboardBaseNoteChange,
  midiButtonRef,
  midiConnectionState,
  bluetoothConnectionState,
  onMidiConnect,
  keyDockCollapsed,
  onKeyDockCollapsedChange,
}: InputPianoDockProps) {
  const [keyboardBasePopoverOpen, setKeyboardBasePopoverOpen] = useState(false)
  const [keyLabelsPopoverOpen, setKeyLabelsPopoverOpen] = useState(false)
  const keyboardBaseButtonRef = useRef<HTMLButtonElement>(null)
  const keyLabelsButtonRef = useRef<HTMLButtonElement>(null)
  const lowerBaseNote = shiftKeyboardBaseNote(keyboardBaseNote, -12)
  const higherBaseNote = shiftKeyboardBaseNote(keyboardBaseNote, 12)

  return (
    <div className="piano-dock input-piano-dock" aria-label="Input and Piano Dock">
      <div className="piano-dock-inner">
        <div className="input-controls" role="toolbar" aria-label="Input controls">
          <div className="input-control-group input-control-group-left">
            <div
              className="keyboard-mapping-control input-dock-control"
              aria-label="Keyboard Mapping"
            >
              <div className="keyboard-mapping-row">
                <button
                  className="app-button app-button--compact keyboard-mapping-button keyboard-mapping-arrow"
                  type="button"
                  aria-label="Lower keyboard base by one octave"
                  disabled={lowerBaseNote === keyboardBaseNote}
                  onClick={() =>
                    onKeyboardBaseNoteChange(
                      shiftKeyboardBaseNote(keyboardBaseNote, -12),
                    )
                  }
                >
                  ◀
                </button>
                <button
                  ref={keyboardBaseButtonRef}
                  className="app-button app-button--compact keyboard-mapping-button keyboard-mapping-range-button"
                  type="button"
                  aria-label={`Keyboard Mapping Range: ${keyboardRangeLabel(
                    keyboardBaseNote,
                  )}`}
                  aria-haspopup="dialog"
                  aria-expanded={keyboardBasePopoverOpen}
                  data-active={keyboardBasePopoverOpen}
                  onClick={() => setKeyboardBasePopoverOpen(true)}
                >
                  {keyboardRangeLabel(keyboardBaseNote)}
                </button>
                <button
                  className="app-button app-button--compact keyboard-mapping-button keyboard-mapping-arrow"
                  type="button"
                  aria-label="Raise keyboard base by one octave"
                  disabled={higherBaseNote === keyboardBaseNote}
                  onClick={() =>
                    onKeyboardBaseNoteChange(
                      shiftKeyboardBaseNote(keyboardBaseNote, 12),
                    )
                  }
                >
                  ▶
                </button>
              </div>
            </div>

            <button
              ref={keyLabelsButtonRef}
              className="app-button dock-option-button"
              type="button"
              aria-haspopup="dialog"
              aria-expanded={keyLabelsPopoverOpen}
              onClick={() => setKeyLabelsPopoverOpen(true)}
            >
              <span className="button-label">Labels</span>
              <span className="button-status">{labelModeText(labelMode)}</span>
            </button>
          </div>

          <div className="input-control-group input-control-group-right">
            <button
              className="app-button dock-status-button"
              type="button"
              aria-pressed={soundEnabled}
              data-active={soundEnabled}
              onClick={() => onSoundChange(!soundEnabled)}
            >
                <span className="button-label">Sound</span>
                <span className="status-indicator" data-status={soundEnabled ? 'on' : 'off'} aria-hidden="true">●</span>
              </button>

            <button
              ref={midiButtonRef}
              className="app-button dock-status-button"
              type="button"
              data-connection-state={midiConnectionState === 'connected' || bluetoothConnectionState === 'connected'
                ? 'connected'
                : midiConnectionState === 'connecting' || bluetoothConnectionState === 'connecting'
                  ? 'connecting'
                  : 'disconnected'}
              onClick={onMidiConnect}
              aria-label="MIDI 输入设备"
              title="打开 USB / Bluetooth MIDI 设置"
            >
              <span className="button-label">MIDI</span>
              <span className="status-indicator" aria-hidden="true">●</span>
            </button>
            <span className="dock-control-divider" aria-hidden="true" />
            <button
              className="app-button app-button--compact dock-toggle-button"
              type="button"
              aria-expanded={!keyDockCollapsed}
              aria-label={keyDockCollapsed ? '展开钢琴键盘' : '收起钢琴键盘'}
              title={keyDockCollapsed ? '展开钢琴键盘' : '收起钢琴键盘'}
              onClick={() => onKeyDockCollapsedChange(!keyDockCollapsed)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="4" width="16" height="10" rx="1.5" />
                <path d="M7 8h10M7 11h2m2 0h2m2 0h2" />
                <path className="dock-toggle-chevron" d={keyDockCollapsed ? 'm8 19 4-4 4 4' : 'm8 16 4 4 4-4'} />
              </svg>
            </button>
          </div>
        </div>

        <Piano
          pressedNotes={pressedNotes}
          labelMode={labelMode}
          onPress={onPress}
          onRelease={onRelease}
          hidden={keyDockCollapsed}
        />
      </div>

      <KeyboardBaseModal
        isOpen={keyboardBasePopoverOpen}
        keyboardBaseNote={keyboardBaseNote}
        anchorRef={keyboardBaseButtonRef}
        onClose={() => setKeyboardBasePopoverOpen(false)}
        onKeyboardBaseNoteChange={onKeyboardBaseNoteChange}
      />

      <KeyLabelsModal
        isOpen={keyLabelsPopoverOpen}
        labelMode={labelMode}
        anchorRef={keyLabelsButtonRef}
        onClose={() => setKeyLabelsPopoverOpen(false)}
        onLabelModeChange={onLabelModeChange}
      />
    </div>
  )
}

export default InputPianoDock
