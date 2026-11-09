import { assertScore, midiToPitch, pitchToMidi, TICKS_PER_QUARTER, type Score, type ScoreEvent } from './score'

/** Bridge for the current quarter-note-only UI. Never flatten a general score. */
export function singleNotesToScore(notes: number[], options: { clef: 'treble' | 'bass'; bpm: number }): Score {
  if (!notes.length) throw new Error('单音练习不能为空。')
  const measures = Math.ceil(notes.length / 4)
  const events: ScoreEvent[] = Array.from({ length: measures * 4 }, (_, i) => i < notes.length
    ? { id: `event-${i}`, kind: 'notes', start: i * TICKS_PER_QUARTER, duration: { denominator: 4 }, notes: [{ id: `note-${i}`, pitch: midiToPitch(notes[i]) }] }
    : { id: `rest-${i}`, kind: 'rest', start: i * TICKS_PER_QUARTER, duration: { denominator: 4 } })
  const score: Score = { version: 1, title: '单音练习', meter: { numerator: 4, denominator: 4 }, tempo: { quarterBpm: options.bpm }, keySignature: 0, measures, voices: [{ id: 'voice-1', clef: options.clef, events }] }
  assertScore(score)
  return score
}
export function scoreToSingleNotes(score: Score): number[] {
  assertScore(score)
  if (score.voices.length !== 1 || score.meter.numerator !== 4 || score.meter.denominator !== 4 || score.keySignature !== 0) throw new Error('当前练习界面仅支持无调号的 4/4 单声部四分音符。')
  const notes: number[] = []
  let padding = false
  for (const event of score.voices[0].events) {
    if (event.duration.denominator !== 4 || event.duration.dotted) throw new Error('当前练习界面尚不支持混合时值。')
    if (event.kind === 'rest') { padding = true; continue }
    if (padding || event.notes.length !== 1 || event.notes[0].tieTo) throw new Error('当前练习界面尚不支持和弦、延音或中间休止符。')
    notes.push(pitchToMidi(event.notes[0].pitch))
  }
  if (!notes.length) throw new Error('单音练习不能为空。')
  return notes
}
