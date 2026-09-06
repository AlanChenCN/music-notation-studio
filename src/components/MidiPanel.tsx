import type { RefObject } from 'react'
import Modal from './Modal'
import {
  BluetoothMidiPanelContent,
  type BluetoothMidiPanelContentProps,
} from './BluetoothMidiPanel'
import {
  MidiMonitorContent,
  type MidiMonitorContentProps,
} from './MidiMonitor'

interface MidiPanelProps extends MidiMonitorContentProps, Omit<BluetoothMidiPanelContentProps, 'onConnectionStateChange'> {
  isOpen: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  onBluetoothConnectionStateChange: BluetoothMidiPanelContentProps['onConnectionStateChange']
}

function MidiPanel({
  isOpen,
  onClose,
  anchorRef,
  onBluetoothConnectionStateChange,
  ...contentProps
}: MidiPanelProps) {
  return (
    <Modal
      isOpen={isOpen}
      title="MIDI"
      anchorRef={anchorRef}
      placement="top"
      size="wide"
      onClose={onClose}
    >
      <div className="midi-unified-panel">
        <section className="midi-unified-section" aria-label="USB MIDI">
          <MidiMonitorContent
            onConnectionChange={contentProps.onConnectionChange}
            onConnectionStateChange={contentProps.onConnectionStateChange}
            onMidiMessage={contentProps.onMidiMessage}
          />
        </section>
        <section className="midi-unified-section" aria-label="Bluetooth MIDI">
          <BluetoothMidiPanelContent
            onConnect={contentProps.onConnect}
            onDisconnect={contentProps.onDisconnect}
            connectedDeviceName={contentProps.connectedDeviceName}
            onConnectionStateChange={onBluetoothConnectionStateChange}
          />
        </section>
      </div>
    </Modal>
  )
}

export default MidiPanel
