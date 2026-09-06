import { useState, type RefObject } from 'react'
import { isWebBluetoothSupported } from '../midi/webBluetooth'
import Modal from './Modal'
import type { InputConnectionState } from './InputDeviceButton'

type BluetoothStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "unsupported"
  | "error"

export interface BluetoothMidiPanelContentProps {
  onConnect: () => Promise<string>
  onDisconnect: () => Promise<void>
  connectedDeviceName: string | null
  onConnectionStateChange: (state: InputConnectionState) => void
}

interface BluetoothMidiPanelProps extends BluetoothMidiPanelContentProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
}

function statusText(status: BluetoothStatus) {
  switch (status) {
    case "connecting":
      return "Scanning for BLE MIDI devices..."
    case "connected":
      return "Bluetooth MIDI connected"
    case "disconnected":
      return "Bluetooth MIDI disconnected"
    case "unsupported":
      return "Web Bluetooth is not supported in this browser."
    case "error":
      return "Unable to connect to the Bluetooth MIDI device."
    default:
      return "Bluetooth MIDI is not connected."
  }
}

export function BluetoothMidiPanelContent({
  onConnect,
  onDisconnect,
  connectedDeviceName,
  onConnectionStateChange,
}: BluetoothMidiPanelContentProps) {
  const [status, setStatus] = useState<BluetoothStatus>(() =>
    isWebBluetoothSupported() ? "idle" : "unsupported",
  )
  const [errorMessage, setErrorMessage] = useState("")

  async function handleConnect() {
    if (!isWebBluetoothSupported()) {
      setStatus("unsupported")
      onConnectionStateChange('disconnected')
      return
    }

    setStatus("connecting")
    setErrorMessage("")
    onConnectionStateChange('connecting')

    try {
      await onConnect()
      setStatus("connected")
      onConnectionStateChange('connected')
    } catch (error) {
      const errorName = error instanceof DOMException ? error.name : "UnknownError"
      setStatus(errorName === "NotFoundError" ? "idle" : "error")
      setErrorMessage(`Bluetooth connection failed: ${errorName}`)
      onConnectionStateChange('disconnected')
    }
  }

  async function handleDisconnect() {
    await onDisconnect()
    setStatus("disconnected")
    onConnectionStateChange('disconnected')
  }

  const currentStatus = connectedDeviceName
    ? "connected"
    : status === "connected"
      ? "disconnected"
      : status

  return (
      <div className="bluetooth-midi-panel">
        <h3>Bluetooth MIDI</h3>
        <p className="midi-status">{statusText(currentStatus)}</p>

        {connectedDeviceName && <p>Device: {connectedDeviceName}</p>}
        {errorMessage && <p className="midi-error">{errorMessage}</p>}

        {status === "unsupported" && (
          <p>Use a supported desktop browser such as Chrome or Edge over HTTPS.</p>
        )}

        {currentStatus !== "unsupported" && currentStatus !== "connected" && (
          <button
            className="app-button app-button--compact"
            type="button"
            disabled={currentStatus === "connecting"}
            onClick={handleConnect}
          >
            {currentStatus === "connecting"
              ? "Scanning..."
              : "Scan and Connect BLE MIDI"}
          </button>
        )}

        {currentStatus === "connected" && (
          <button
            className="app-button app-button--compact"
            type="button"
            onClick={handleDisconnect}
          >
            Disconnect
          </button>
        )}

      </div>
  )
}

function BluetoothMidiPanel({
  isOpen,
  onClose,
  anchorRef,
  onConnect,
  onDisconnect,
  connectedDeviceName,
  onConnectionStateChange,
}: BluetoothMidiPanelProps) {
  return (
    <Modal
      isOpen={isOpen}
      title="Bluetooth MIDI"
      anchorRef={anchorRef}
      placement="top"
      size="wide"
      onClose={onClose}
    >
      <BluetoothMidiPanelContent
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        connectedDeviceName={connectedDeviceName}
        onConnectionStateChange={onConnectionStateChange}
      />
    </Modal>
  )
}

export default BluetoothMidiPanel
