import { useEffect, useRef, useState, type RefObject } from 'react'
import {
  connectMidiInput,
  isWebMidiSupported,
  listMidiInputs,
  requestMidiAccess,
  type MidiInputInfo,
} from '../midi/webMidi'
import Modal from './Modal'
import type { InputConnectionState } from './InputDeviceButton'

type MidiAccessStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "unsupported"
  | "denied"
  | "error"

export interface MidiMonitorContentProps {
  onConnectionChange: (deviceName: string | null) => void
  onConnectionStateChange: (state: InputConnectionState) => void
  onMidiMessage: (event: MIDIMessageEvent) => void
}

interface MidiMonitorProps extends MidiMonitorContentProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
}

function statusText(status: MidiAccessStatus) {
  switch (status) {
    case "requesting":
      return "Requesting MIDI permission..."
    case "ready":
      return "MIDI access granted"
    case "unsupported":
      return "Web MIDI is not supported in this browser."
    case "denied":
      return "MIDI permission was denied."
    case "error":
      return "Unable to access MIDI devices."
    default:
      return "MIDI access has not been requested."
  }
}

export function MidiMonitorContent({
  onConnectionChange,
  onConnectionStateChange,
  onMidiMessage,
}: MidiMonitorContentProps) {
  const [status, setStatus] = useState<MidiAccessStatus>(() =>
    isWebMidiSupported() ? "idle" : "unsupported",
  )
  const [errorMessage, setErrorMessage] = useState("")
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null)
  const [inputs, setInputs] = useState<MidiInputInfo[]>([])
  const [selectedInputId, setSelectedInputId] = useState("")
  const [connectedInputId, setConnectedInputId] = useState("")
  const disconnectActiveInput = useRef<(() => Promise<void>) | null>(null)

  useEffect(() => {
    return () => {
      void disconnectActiveInput.current?.()
      onConnectionChange(null)
      onConnectionStateChange('disconnected')
    }
  }, [onConnectionChange, onConnectionStateChange])

  useEffect(() => {
    if (!midiAccess) {
      return
    }

    const updateInputs = () => {
      const nextInputs = listMidiInputs(midiAccess)
      setInputs(nextInputs)
      setSelectedInputId(currentId =>
        nextInputs.some(input => input.id === currentId) ? currentId : "",
      )

      if (
        connectedInputId &&
        !nextInputs.some(input => input.id === connectedInputId)
      ) {
        void disconnectActiveInput.current?.()
        disconnectActiveInput.current = null
        setConnectedInputId("")
        onConnectionChange(null)
        onConnectionStateChange('disconnected')
      }
    }

    updateInputs()
    midiAccess.addEventListener("statechange", updateInputs)

    return () => {
      midiAccess.removeEventListener("statechange", updateInputs)
    }
  }, [
    connectedInputId,
    midiAccess,
    onConnectionChange,
    onConnectionStateChange,
  ])

  async function handleRequestAccess() {
    if (!isWebMidiSupported()) {
      setStatus("unsupported")
      return
    }

    setStatus("requesting")
    setErrorMessage("")
    onConnectionStateChange('connecting')

    try {
      const access = await requestMidiAccess()
      setMidiAccess(access)
      setInputs(listMidiInputs(access))
      setStatus("ready")
      onConnectionStateChange('disconnected')
    } catch (error) {
      const errorName = error instanceof DOMException ? error.name : "UnknownError"
      setStatus(errorName === "NotAllowedError" ? "denied" : "error")
      setErrorMessage(`MIDI access failed: ${errorName}`)
      onConnectionStateChange('disconnected')
    }
  }

  async function handleConnectSelectedInput() {
    const selectedInput = inputs.find(input => input.id === selectedInputId)

    if (!selectedInput) {
      return
    }

    setErrorMessage("")
    onConnectionStateChange('connecting')

    try {
      const disconnectPreviousInput = disconnectActiveInput.current
      disconnectActiveInput.current = null
      await disconnectPreviousInput?.()
      setConnectedInputId("")
      onConnectionChange(null)

      const disconnect = await connectMidiInput(
        selectedInput.input,
        onMidiMessage,
      )

      disconnectActiveInput.current = disconnect
      setConnectedInputId(selectedInput.id)
      onConnectionChange(selectedInput.name)
      onConnectionStateChange('connected')
    } catch (error) {
      const errorName = error instanceof DOMException ? error.name : "UnknownError"
      setErrorMessage(`MIDI connection failed: ${errorName}`)
      onConnectionChange(null)
      onConnectionStateChange('disconnected')
    }
  }

  return (
      <div className="midi-monitor-panel">
        <h3>USB MIDI</h3>
        <p className="midi-status">{statusText(status)}</p>

        {errorMessage && <p className="midi-error">{errorMessage}</p>}

        {status === "unsupported" && (
          <p>Use a supported desktop browser such as Chrome or Edge.</p>
        )}

        {(status === "idle" || status === "denied" || status === "error") && (
          <button
            className="app-button app-button--compact"
            type="button"
            onClick={handleRequestAccess}
          >
            Request MIDI Access
          </button>
        )}

        {status === "ready" && (
          <>
            {inputs.length === 0 ? (
              <p>No MIDI Input devices found.</p>
            ) : (
              <>
                <table className="midi-device-table">
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>Device Name</th>
                      <th>Manufacturer</th>
                      <th>Connection State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inputs.map(input => (
                      <tr key={input.id}>
                        <td>
                          <input
                            type="radio"
                            name="midi-input"
                            value={input.id}
                            checked={selectedInputId === input.id}
                            onChange={() => setSelectedInputId(input.id)}
                            aria-label={`Select ${input.name}`}
                          />
                        </td>
                        <td>{input.name}</td>
                        <td>{input.manufacturer}</td>
                        <td>{input.state}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button
                  className="app-button app-button--compact"
                  type="button"
                  disabled={!selectedInputId}
                  onClick={handleConnectSelectedInput}
                >
                  Connect Selected Input
                </button>
              </>
            )}
          </>
        )}

        {connectedInputId && (
          <p className="midi-monitor-note">
            Note On / Note Off messages are logged to the browser Console.
          </p>
        )}
      </div>
  )
}

function MidiMonitor({
  isOpen,
  onClose,
  anchorRef,
  onConnectionChange,
  onConnectionStateChange,
  onMidiMessage,
}: MidiMonitorProps) {
  return (
    <Modal
      isOpen={isOpen}
      title="USB MIDI"
      anchorRef={anchorRef}
      placement="top"
      size="wide"
      onClose={onClose}
    >
      <MidiMonitorContent
        onConnectionChange={onConnectionChange}
        onConnectionStateChange={onConnectionStateChange}
        onMidiMessage={onMidiMessage}
      />
    </Modal>
  )
}

export default MidiMonitor
