import { practiceTimeline } from './practiceEngine'
import { TICKS_PER_QUARTER, type Score } from './score'

/** Start a quiet synthesized performance, preserving rests and merged ties. */
export function playScore(context: AudioContext, score: Score, fromTick: number) {
  const secondsPerTick = 60 / (score.tempo.quarterBpm * TICKS_PER_QUARTER)
  const start = context.currentTime + .04
  const output = context.createGain()
  output.gain.value = .4
  output.connect(context.destination)
  const voices: OscillatorNode[] = []
  for (const target of practiceTimeline(score).targets) {
    for (const [pitch, end] of target.pitches) {
      if (end <= fromTick) continue
      const on = start + (Math.max(target.start, fromTick) - fromTick) * secondsPerTick
      const off = start + (end - fromTick) * secondsPerTick
      const attack = Math.min(.008, (off - on) / 3)
      const tone = context.createOscillator()
      const envelope = context.createGain()
      tone.type = 'triangle'
      tone.frequency.value = 440 * 2 ** ((pitch - 69) / 12)
      envelope.gain.setValueAtTime(.0001, on)
      envelope.gain.exponentialRampToValueAtTime(.15, on + attack)
      envelope.gain.exponentialRampToValueAtTime(.045, off)
      envelope.gain.exponentialRampToValueAtTime(.0001, off + .05)
      tone.connect(envelope).connect(output)
      tone.start(on)
      tone.stop(off + .055)
      voices.push(tone)
    }
  }
  return { start, stop() { output.disconnect(); voices.forEach(tone => tone.stop()) } }
}
