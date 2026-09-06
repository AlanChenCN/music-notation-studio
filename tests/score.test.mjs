import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createScore, insertEvent, replaceEvent, deleteEvent, measureBeats, parseScore, scoreLength, soundingPitches } from '../src/score/scoreModel.ts'
import { notationSegments } from '../src/score/notation.ts'
import { ScoreTransport } from '../src/score/scoreTransport.ts'
import { midiNumberToPianoNote } from '../src/data/piano.ts'
import { getStaffNotePosition } from '../src/data/staff.ts'
import { createGrandStaffGeometry } from '../src/data/staffGeometry.ts'

function phrase(entries = [[[60], 1], [[60], 1], [[], 1], [[64, 67], 2]]) {
  return entries.reduce((score, [pitches, duration]) => insertEvent(score, score.events.length, pitches, duration), createScore())
}
function player(score = phrase()) {
  let time = 0
  const events = []
  const transport = new ScoreTransport({ ...score, tempo: 60 }, pitch => events.push(['on', pitch]), pitch => events.push(['off', pitch]), () => time)
  return { transport, events, advance(ms) { time += ms; transport.tick() } }
}
test('shared grand-staff geometry places middle C between the inner staff lines', () => {
  const geometry = createGrandStaffGeometry(164, 6)
  const middleC = getStaffNotePosition(midiNumberToPianoNote(60))
  const middleCY = geometry.noteY(middleC.staff, middleC.staffStep)
  const innerLinesMidpoint = (geometry.noteY('treble', 0) + geometry.noteY('bass', 8)) / 2

  assert.equal(middleCY, innerLinesMidpoint)
  assert.equal(geometry.staffBottomY.bass - geometry.staffBottomY.treble, 72)
})
test('insert, resize, delete preserve a contiguous timeline and stable identities', () => {
  const original = phrase()
  const inserted = insertEvent(original, 1, [72], .5)
  assert.deepEqual(inserted.events.map(e => e.startBeat), [0, 1, 1.5, 2.5, 3.5])
  const resized = replaceEvent(inserted, inserted.events[0].id, { duration: 4 })
  assert.equal(resized.events[1].startBeat, 4)
  const deleted = deleteEvent(resized, inserted.events[1].id)
  assert.deepEqual(deleted.events.map(e => e.id), original.events.map(e => e.id))
  assert.equal(scoreLength(deleted), 8)
  assert.equal(original.events[0].duration, 1)
})
test('single notes, chords, and rests survive file round-trip', () => {
  const score = phrase()
  assert.deepEqual(parseScore(JSON.stringify(score)), score)
  assert.deepEqual(parseScore('\uFEFF' + JSON.stringify(score)), score)
  assert.deepEqual(soundingPitches(score, 2), [])
  assert.deepEqual(soundingPitches(score, 3.25), [64, 67])
  assert.deepEqual(soundingPitches(score, 5), [])
})
test('invalid imports are rejected, including duplicate IDs and pitches', () => {
  const mutations = [
    s => s.version = 2, s => s.tempo = 0, s => s.tempo = null,
    s => s.timeSignature = [7, 4], s => s.events[0].startBeat = 1,
    s => s.events[0].duration = -1, s => s.events[0].duration = .3,
    s => s.events[0].pitches = [20], s => s.events[0].pitches = [109],
    s => s.events[0].pitches = [60, 60], s => s.events[1].id = s.events[0].id,
    s => s.events[0] = null, s => s.title = 'x'.repeat(121),
  ]
  for (const mutate of mutations) { const score = phrase(); mutate(score); assert.throws(() => parseScore(JSON.stringify(score))) }
  assert.throws(() => parseScore('{'))
  assert.throws(() => parseScore('x'.repeat(2_000_001)))
})
test('notation splits at barlines with ties without changing musical duration', () => {
  const score = phrase([[[], .25], [[60], 4]])
  const parts = notationSegments(score).slice(1)
  assert.deepEqual(parts.map(p => p.duration), [2, 1, .5, .25, .25])
  assert.equal(parts.reduce((sum, p) => sum + p.duration, 0), 4)
  assert.equal(parts[0].tiedFrom, false)
  assert.equal(parts.at(-1).tiedTo, false)
  assert.ok(parts.every(p => p.beat % 4 + p.duration <= 4))
})
test('common time signatures round-trip and define measure boundaries', () => {
  const score = { ...phrase([[[], .25], [[60], 4]]), timeSignature: [3, 4] }
  const parts = notationSegments(score).slice(1)
  assert.deepEqual(parseScore(JSON.stringify(score)).timeSignature, [3, 4])
  assert.equal(measureBeats(score.timeSignature), 3)
  assert.equal(measureBeats([6, 8]), 3)
  assert.ok(parts.every(part => part.beat % 3 + part.duration <= 3))
})
test('adjacent repeated notes rearticulate, then silence for a rest', () => {
  const p = player(); p.transport.play(); p.advance(1000); p.advance(1000)
  assert.deepEqual(p.events, [['on', 60], ['off', 60], ['on', 60], ['off', 60]])
})
test('seek while playing releases old pitches and resumes a chord mid-note', () => {
  const p = player(); p.transport.play(); p.transport.seek(3.5)
  assert.deepEqual(p.events, [['on', 60], ['off', 60], ['on', 64], ['on', 67]])
  assert.equal(p.transport.getSnapshot().playing, true)
  p.advance(1500)
  assert.equal(p.transport.getSnapshot().playing, false)
  assert.deepEqual(p.events.slice(-2), [['off', 64], ['off', 67]])
})
test('paused seek remains silent; resume starts from selected beat', () => {
  const p = player(); p.transport.seek(3.5); assert.deepEqual(p.events, [])
  p.transport.play(); p.advance(250); p.transport.pause()
  assert.equal(p.transport.getSnapshot().beat, 3.75)
  const count = p.events.length; p.advance(5000); assert.equal(p.events.length, count)
  p.transport.play(); assert.deepEqual(p.events.slice(-2), [['on', 64], ['on', 67]])
})
test('stop, end, and replay reset correctly; empty scores do not play', () => {
  const p = player(); p.transport.play(); p.transport.stop()
  assert.deepEqual(p.transport.getSnapshot(), { beat: 0, playing: false })
  p.transport.seek(500); p.transport.play()
  assert.equal(p.transport.getSnapshot().beat, 0)
  p.advance(5000); assert.equal(p.transport.getSnapshot().beat, 5)
  const empty = player(createScore()); empty.transport.play(); assert.equal(empty.transport.getSnapshot().playing, false)
})
test('editing during playback silences playback and clamps its position', () => {
  const p = player(); p.transport.seek(4); p.transport.play(); p.transport.setScore(phrase([[[72], 1]]))
  assert.deepEqual(p.transport.getSnapshot(), { beat: 1, playing: false })
  assert.deepEqual(p.events.slice(-2), [['off', 64], ['off', 67]])
})
test('a late timer derives position from elapsed time rather than accumulating drift', () => {
  const p = player(); p.transport.play(); p.advance(3500)
  assert.equal(p.transport.getSnapshot().beat, 3.5)
  assert.deepEqual(p.events.slice(-2), [['on', 64], ['on', 67]])
})
test('transport keeps one animation frame scheduled while playing', () => {
  const previousRequest = globalThis.requestAnimationFrame
  const previousCancel = globalThis.cancelAnimationFrame
  const callbacks = new Map()
  let nextId = 1
  globalThis.requestAnimationFrame = callback => { const id = nextId++; callbacks.set(id, callback); return id }
  globalThis.cancelAnimationFrame = id => { callbacks.delete(id) }
  try {
    const p = player()
    p.transport.play()
    p.transport.tick()
    p.transport.tick()
    assert.equal(callbacks.size, 1)
    p.transport.pause()
    assert.equal(callbacks.size, 0)
  } finally {
    if (previousRequest) globalThis.requestAnimationFrame = previousRequest
    else delete globalThis.requestAnimationFrame
    if (previousCancel) globalThis.cancelAnimationFrame = previousCancel
    else delete globalThis.cancelAnimationFrame
  }
})
