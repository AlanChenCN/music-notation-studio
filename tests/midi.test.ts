import { describe, expect, it } from 'vitest'
import { decodeBlePacket, MidiDecoder } from '../src/midi'

const packet = (bytes: number[], decoder = new MidiDecoder()) => decodeBlePacket(new DataView(Uint8Array.from(bytes).buffer), decoder).filter(Boolean)
describe('MIDI 字节流', () => {
  it('处理通道、running status、实时消息与力度为零的 note-on', () => {
    const decoder = new MidiDecoder()
    const notes = [0x92, 60, 100, 62, 0xf8, 90, 60, 0].map(byte => decoder.feed(byte)).filter(Boolean)
    expect(notes).toEqual([{ pitch: 60, down: true, channel: 2 }, { pitch: 62, down: true, channel: 2 }, { pitch: 60, down: false, channel: 2 }])
  })
  it('忽略非音符的通道消息', () => {
    const decoder = new MidiDecoder()
    expect([0xb0, 64, 127, 0xc0, 5].map(byte => decoder.feed(byte)).filter(Boolean)).toEqual([])
  })
})
describe('BLE MIDI 数据包', () => {
  it('区分时间戳与 MIDI 状态，解析单包多个音符及释放', () => {
    expect(packet([0x80, 0x80, 0x90, 60, 100, 0x81, 0x90, 64, 100, 0x82, 0x80, 60, 0])).toEqual([
      { pitch: 60, down: true, channel: 0 }, { pitch: 64, down: true, channel: 0 }, { pitch: 60, down: false, channel: 0 },
    ])
  })
  it('支持省略状态字节和跨包 running status', () => {
    const decoder = new MidiDecoder()
    expect(packet([0x80, 0x80, 0x90, 60, 100, 64, 100], decoder)).toHaveLength(2)
    expect(packet([0x80, 0x81, 60, 0], decoder)).toEqual([{ pitch: 60, down: false, channel: 0 }])
  })
  it('忽略系统独占消息，不将其数据解释为音符', () => {
    expect(packet([0x80, 0x80, 0xf0, 1, 2, 3, 0xf7, 0x82, 0x90, 65, 90])).toEqual([{ pitch: 65, down: true, channel: 0 }])
  })
})
