import {
  midiNumberForFrequency,
  nearestPianoSample,
  pianoSampleAnchors,
  pianoSampleUrl,
} from './pianoSamples'

interface ActiveVoice {
  gain: GainNode
  source: AudioScheduledSourceNode
}

const activeVoices = new Map<string, ActiveVoice>()
const sampleBuffers = new Map<number, AudioBuffer>()

let audioContext: AudioContext | undefined
let masterGain: GainNode | undefined
let compressor: DynamicsCompressorNode | undefined
let sampleLoadStarted = false
let audioEnabled = true

function contextForPlayback() {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

function outputFor(context: AudioContext) {
  if (masterGain && compressor) {
    return masterGain
  }
  masterGain = context.createGain()
  compressor = context.createDynamicsCompressor()
  masterGain.gain.value = audioEnabled ? 0.85 : 0
  compressor.threshold.value = -20
  compressor.knee.value = 18
  compressor.ratio.value = 8
  compressor.attack.value = 0.003
  compressor.release.value = 0.18
  masterGain.connect(compressor)
  compressor.connect(context.destination)
  return masterGain
}

function loadSamples(context: AudioContext) {
  if (sampleLoadStarted || typeof window === 'undefined') {
    return
  }
  sampleLoadStarted = true
  void Promise.all(pianoSampleAnchors.map(async sample => {
    try {
      const response = await fetch(pianoSampleUrl(sample.file))
      if (!response.ok) {
        return
      }
      const buffer = await context.decodeAudioData(await response.arrayBuffer())
      sampleBuffers.set(sample.midiNumber, buffer)
    } catch {
      // The synth fallback remains available when a local sample cannot load.
    }
  }))
}

function velocityGain(velocity?: number) {
  const normalized = velocity === undefined ? 0.72 : Math.min(1, Math.max(0.08, velocity / 127))
  return 0.08 + normalized * 0.13
}

function createSampleVoice(context: AudioContext, frequency: number, gain: GainNode, startTime: number) {
  const midiNumber = midiNumberForFrequency(frequency)
  const sample = nearestPianoSample(midiNumber)
  const buffer = sampleBuffers.get(sample.midiNumber)
  if (!buffer) {
    return undefined
  }
  const source = context.createBufferSource()
  source.buffer = buffer
  source.playbackRate.setValueAtTime(2 ** ((midiNumber - sample.midiNumber) / 12), startTime)
  source.connect(gain)
  source.start(startTime)
  return source
}

function createFallbackVoice(context: AudioContext, frequency: number, gain: GainNode, startTime: number) {
  const source = context.createOscillator()
  source.type = 'triangle'
  source.frequency.setValueAtTime(frequency, startTime)
  source.connect(gain)
  source.start(startTime)
  return source
}

function startEnvelope(gain: GainNode, level: number, startTime: number) {
  gain.gain.cancelScheduledValues(startTime)
  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.linearRampToValueAtTime(level, startTime + 0.008)
}

export function setAudioEnabled(enabled: boolean) {
  audioEnabled = enabled
  if (masterGain && audioContext) {
    const now = audioContext.currentTime
    masterGain.gain.cancelScheduledValues(now)
    masterGain.gain.setValueAtTime(masterGain.gain.value, now)
    masterGain.gain.linearRampToValueAtTime(enabled ? 0.85 : 0.0001, now + 0.012)
  }
  if (!enabled) {
    Array.from(activeVoices.keys()).forEach(stopNote)
  }
}

/** Starts one independently releasable voice. The identifier must include its input source. */
export function startNote(id: string, frequency: number, velocity?: number) {
  if (!audioEnabled || activeVoices.has(id)) {
    return
  }
  const context = contextForPlayback()
  if (context.state === 'suspended') {
    void context.resume()
  }
  loadSamples(context)
  const gain = context.createGain()
  const startTime = context.currentTime + 0.005
  startEnvelope(gain, velocityGain(velocity), startTime)
  gain.connect(outputFor(context))
  const source = createSampleVoice(context, frequency, gain, startTime)
    ?? createFallbackVoice(context, frequency, gain, startTime)
  activeVoices.set(id, { gain, source })
}

export function stopNote(id: string) {
  const voice = activeVoices.get(id)
  if (!voice || !audioContext) {
    return
  }
  const now = audioContext.currentTime
  voice.gain.gain.cancelScheduledValues(now)
  voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.gain.gain.value), now)
  voice.gain.gain.linearRampToValueAtTime(0.0001, now + 0.16)
  try {
    voice.source.stop(now + 0.19)
  } catch {
    // A naturally finished sample needs no additional cleanup.
  }
  activeVoices.delete(id)
}
