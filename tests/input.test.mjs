import { test } from 'node:test'
import assert from 'node:assert/strict'
import { InputLayer } from '../src/input/inputLayer.ts'
import { KeyboardController } from '../src/input/keyboardController.ts'
import { midiNumberForFrequency, nearestPianoSample } from '../src/audio/pianoSamples.ts'

test('typing, shortcuts, and repeats do not become piano input; keyup still releases a held note', () => {
  const listeners = new Map()
  const originalWindow = globalThis.window
  const originalElement = globalThis.HTMLElement
  class Element { constructor(editable) { this.editable = editable } closest() { return this.editable } }
  globalThis.HTMLElement = Element
  globalThis.window = { addEventListener: (type, handler) => listeners.set(type, handler), removeEventListener: type => listeners.delete(type) }
  try {
    const notes = []
    const controller = new KeyboardController(new InputLayer({ pressNote: note => notes.push(['on', note]), releaseNote: note => notes.push(['off', note]) }))
    controller.start()
    const key = (type, extra = {}) => listeners.get(type)({ key: 'h', target: new Element(false), ...extra })
    key('keydown', { target: new Element(true) }); key('keydown', { ctrlKey: true }); key('keydown', { repeat: true })
    assert.deepEqual(notes, [])
    key('keydown'); key('keydown')
    key('keyup', { target: new Element(true) })
    assert.deepEqual(notes, [['on', 'C4'], ['off', 'C4']])
    key('keydown'); listeners.get('blur')()
    assert.deepEqual(notes.slice(-2), [['on', 'C4'], ['off', 'C4']])
    controller.stop()
    assert.equal(listeners.size, 0)
  } finally { globalThis.window = originalWindow; globalThis.HTMLElement = originalElement }
})

test('audio ignores duplicate starts and keeps playback voices independent of live input', async () => {
  const original = globalThis.AudioContext
  const oscillators = []
  globalThis.AudioContext = class {
    state = 'running'; currentTime = 0; destination = {}
    createOscillator() { const oscillator = { frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() { this.stopped = true }, stopped: false }; oscillators.push(oscillator); return oscillator }
    createGain() { return { gain: { value: 0, cancelScheduledValues() {}, setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} } }
    createDynamicsCompressor() { return { threshold: {}, knee: {}, ratio: {}, attack: {}, release: {}, connect() {} } }
  }
  try {
    const audio = await import('../src/audio/sound.ts')
    audio.startNote('C4', 261); audio.startNote('C4', 261); audio.startNote('score:C4', 261)
    assert.equal(oscillators.length, 2)
    audio.stopNote('score:C4')
    assert.equal(oscillators[0].stopped, false); assert.equal(oscillators[1].stopped, true)
    audio.setAudioEnabled(false)
    assert.equal(oscillators[0].stopped, true)
    audio.startNote('C4', 261); assert.equal(oscillators.length, 2)
  } finally { globalThis.AudioContext = original }
})

test('piano samples select the nearest anchor across the full keyboard range', () => {
  assert.equal(midiNumberForFrequency(440), 69)
  assert.equal(nearestPianoSample(21).midiNumber, 21)
  assert.equal(nearestPianoSample(61).midiNumber, 60)
  assert.equal(nearestPianoSample(108).midiNumber, 96)
})
