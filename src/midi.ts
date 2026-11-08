export interface MidiNote { pitch: number; down: boolean; key: string }
export interface MidiState { connected: boolean; name: string; error: string; busy: boolean; path: 'bluetooth' | 'webmidi' | null }
const serviceId = '03b80e5a-ede8-4b33-a751-6ce34ec4c700'
const characteristicId = '7772e5db-3868-4112-a1a9-f2669d106bf3'

/** Stateful decoder: handles channel running status and real-time bytes. */
export class MidiDecoder {
  private status = 0
  private data: number[] = []
  feed(byte: number): { pitch: number; down: boolean; channel: number } | null {
    if (byte >= 0xf8) return null
    if (byte & 0x80) {
      this.status = byte < 0xf0 ? byte : 0
      this.data = []
      return null
    }
    if (!this.status) return null
    this.data.push(byte)
    const kind = this.status & 0xf0
    const count = kind === 0xc0 || kind === 0xd0 ? 1 : 2
    if (this.data.length < count) return null
    const [pitch, velocity] = this.data
    this.data = []
    return kind === 0x80 || kind === 0x90 ? { pitch, down: kind === 0x90 && velocity > 0, channel: this.status & 0x0f } : null
  }
}

/** BLE packets alternate timestamp bytes with MIDI messages. Timestamp bytes are not MIDI status. */
export function decodeBlePacket(view: DataView, decoder: MidiDecoder): ReturnType<MidiDecoder['feed']>[] {
  const notes: ReturnType<MidiDecoder['feed']>[] = []
  if (view.byteLength < 3 || !(view.getUint8(0) & 0x80)) return notes
  let expectTimestamp = true
  let remaining = 0
  let runningLength = 2
  let sysex = false
  for (let i = 1; i < view.byteLength; i++) {
    const byte = view.getUint8(i)
    if (expectTimestamp && byte & 0x80) { expectTimestamp = false; continue }
    if (byte >= 0xf8) { decoder.feed(byte); expectTimestamp = remaining === 0; continue }
    if (byte === 0xf0) sysex = true
    if (sysex) { decoder.feed(byte); if (byte === 0xf7) { sysex = false; expectTimestamp = true }; continue }
    if (byte & 0x80) {
      runningLength = (byte & 0xf0) === 0xc0 || (byte & 0xf0) === 0xd0 ? 1 : 2
      remaining = runningLength
    } else {
      if (!remaining) remaining = runningLength
      remaining--
    }
    const note = decoder.feed(byte)
    if (note) notes.push(note)
    expectTimestamp = remaining === 0
  }
  return notes
}

export class MidiConnection {
  private device?: BluetoothDevice
  private characteristic?: BluetoothRemoteGATTCharacteristic
  private access?: MIDIAccess
  private decoders = new Map<string, MidiDecoder>()
  private generation = 0
  private state: MidiState = { connected: false, name: '', error: '', busy: false, path: null }
  constructor(private onNote: (note: MidiNote) => void, private onState: (state: MidiState) => void, private onRelease: () => void) {}
  private publish(patch: Partial<MidiState>) { this.state = { ...this.state, ...patch }; this.onState(this.state) }
  private deliver = (source: string, note: NonNullable<ReturnType<MidiDecoder['feed']>>) => {
    this.onNote({ pitch: note.pitch, down: note.down, key: `midi:${source}:${note.channel}:${note.pitch}` })
  }
  private notification = (event: Event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value
    if (!value) return
    let decoder = this.decoders.get('ble')
    if (!decoder) { decoder = new MidiDecoder(); this.decoders.set('ble', decoder) }
    for (const note of decodeBlePacket(value, decoder)) if (note) this.deliver('ble', note)
  }
  private disconnected = () => {
    this.onRelease()
    this.publish({ connected: false, name: '', busy: false, error: '连接已断开，请重新连接。' })
  }
  async connectBluetooth() {
    if (this.state.busy) return
    if (!navigator.bluetooth) { this.publish({ error: '未检测到蓝牙网页接口。请启用 Beacio 对此网站的权限，或尝试系统 MIDI。' }); return }
    this.disconnect()
    const generation = this.generation
    this.publish({ busy: true, error: '', path: 'bluetooth' })
    try {
      const device = await navigator.bluetooth.requestDevice({ filters: [{ services: [serviceId] }] })
      if (generation !== this.generation) return
      this.device = device
      device.addEventListener('gattserverdisconnected', this.disconnected)
      const server = await device.gatt!.connect()
      const service = await server.getPrimaryService(serviceId)
      const characteristic = await service.getCharacteristic(characteristicId)
      if (generation !== this.generation) { device.gatt?.disconnect(); return }
      this.characteristic = characteristic
      characteristic.addEventListener('characteristicvaluechanged', this.notification)
      await characteristic.startNotifications()
      if (generation !== this.generation) return
      this.publish({ connected: true, name: device.name || '蓝牙 MIDI', busy: false })
    } catch (error) {
      if (generation !== this.generation) return
      this.disconnect()
      this.publish({ error: error instanceof Error && error.name === 'NotFoundError' ? '已取消选择，可再次连接。' : '蓝牙连接失败，请检查 HTTPS、插件权限及电钢琴状态。', busy: false })
    }
  }
  private bindInputs = () => {
    if (!this.access) return
    this.onRelease()
    this.decoders.clear()
    const names: string[] = []
    this.access.inputs.forEach(input => {
      input.onmidimessage = null
      if (input.state !== 'connected') return
      names.push(input.name || 'MIDI 输入')
      const decoder = new MidiDecoder()
      this.decoders.set(input.id, decoder)
      input.onmidimessage = event => {
        for (const byte of event.data || []) { const note = decoder.feed(byte); if (note) this.deliver(input.id, note) }
      }
    })
    this.publish({ connected: names.length > 0, name: names.join('、'), busy: false,
      error: names.length ? '' : '暂未发现 MIDI 输入，请检查系统中的设备连接。' })
  }
  async connectWebMidi() {
    if (this.state.busy) return
    if (!navigator.requestMIDIAccess) { this.publish({ error: '未检测到系统 MIDI 接口，请使用蓝牙 MIDI 连接。' }); return }
    this.disconnect()
    const generation = this.generation
    this.publish({ busy: true, error: '', path: 'webmidi' })
    try {
      const access = await navigator.requestMIDIAccess({ sysex: false })
      if (generation !== this.generation) return
      this.access = access
      access.onstatechange = this.bindInputs
      this.bindInputs()
    } catch {
      if (generation === this.generation) this.publish({ busy: false, error: '无法访问系统 MIDI，请检查网站权限。' })
    }
  }
  disconnect() {
    this.generation++
    this.characteristic?.removeEventListener('characteristicvaluechanged', this.notification)
    this.device?.removeEventListener('gattserverdisconnected', this.disconnected)
    this.device?.gatt?.disconnect()
    if (this.access) { this.access.onstatechange = null; this.access.inputs.forEach(input => { input.onmidimessage = null }) }
    this.access = undefined
    this.characteristic = undefined
    this.device = undefined
    this.decoders.clear()
    this.onRelease()
    this.publish({ connected: false, name: '', error: '', busy: false, path: null })
  }
}
