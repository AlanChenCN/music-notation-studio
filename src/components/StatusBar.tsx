import {
  keyboardRangeLabel,
  type KeyboardBaseNote,
} from '../input/keyboardMapper'

interface StatusBarProps {
  keyboardBaseNote: KeyboardBaseNote
  midiDeviceName: string | null
  bluetoothMidiDeviceName: string | null
}

function StatusBar({
  keyboardBaseNote,
  midiDeviceName,
  bluetoothMidiDeviceName,
}: StatusBarProps) {
  const connectedDevices = [
    midiDeviceName ? `🎹 ${midiDeviceName} Connected` : null,
    bluetoothMidiDeviceName
      ? `Bluetooth MIDI: ${bluetoothMidiDeviceName} Connected`
      : null,
  ].filter((device): device is string => device !== null)
  const midiStatus = connectedDevices.length
    ? connectedDevices.join(" | ")
    : "MIDI: Not Connected"

  return (
    <footer className="status-bar">
      Ready | Keyboard: {keyboardRangeLabel(keyboardBaseNote)} | Base: {keyboardBaseNote} | {midiStatus} | v0.6.0
    </footer>
  )
}

export default StatusBar
