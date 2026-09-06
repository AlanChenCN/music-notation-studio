import test from 'node:test'
import assert from 'node:assert/strict'
import { ScorePractice } from '../src/practice/scorePractice.ts'
const score = (pitches = [[60], [60, 64, 67], [], [62]]) => ({ version: 1, title: 'practice', tempo: 90, timeSignature: [4, 4], events: pitches.map((p, i) => ({ id: String(i), startBeat: i, duration: 1, pitches: p })) })
const play = (c, notes) => { notes.forEach(p => c.press(String(p), p)); notes.forEach(p => c.release(String(p))) }
test('practice clones editor data, skips rests and advances only after all keys release', () => {
  const source = score(); const c = new ScorePractice(); c.load(source); source.events[0].pitches[0] = 80
  c.start(); c.press('60', 60); assert.equal(c.getSnapshot().index, 0); c.release('60')
  assert.equal(c.getSnapshot().index, 1)
  c.press('60', 60); c.press('64', 64); c.press('67', 67); c.release('60'); c.release('64'); assert.equal(c.getSnapshot().index, 1); c.release('67')
  play(c, [62]); assert.equal(c.getSnapshot().completed, 3); assert.equal(c.getSnapshot().firstTry, 3); assert.equal(c.getSnapshot().running, false)
})
test('wrong pitches and incomplete chords count once per attempt; duplicate releases are ignored', () => {
  const c = new ScorePractice(); c.load(score([[60,64,67]])); c.start(); c.release('unknown')
  play(c, [60]); assert.equal(c.getSnapshot().errors, 1)
  play(c, [60,64,66]); c.release('66'); assert.equal(c.getSnapshot().errors, 2)
  play(c, [60,64,67]); assert.equal(c.getSnapshot().firstTry, 0); assert.equal(c.getSnapshot().completed, 1)
})
test('extra pitch invalidates a matched chord and sequential nonoverlapping notes do not match', () => {
  const c = new ScorePractice(); c.load(score([[60,64]])); c.start()
  c.press('a',60); c.press('b',64); c.press('c',65); c.release('c'); c.release('b'); c.release('a')
  assert.equal(c.getSnapshot().index,0); assert.equal(c.getSnapshot().errors,1)
  play(c,[60]); play(c,[64]); assert.equal(c.getSnapshot().index,0)
})
test('measure range includes a tied event only once, validates bounds and loops with a retained result', () => {
  const c = new ScorePractice(); const s = score([[60],[62],[64]]); s.events[0].duration=4; s.events[1].startBeat=4; s.events[1].duration=4; s.events[2].startBeat=8; s.timeSignature=[3,4]
  c.load(s); c.configure(2,2,true); assert.deepEqual(c.targets().map(e=>e.id),['0','1'])
  c.configure(0,99,false); assert.equal(c.getSnapshot().from,2)
  c.start(); play(c,[60]); play(c,[62]); assert.equal(c.getSnapshot().rounds,1); assert.equal(c.getSnapshot().index,0); assert.equal(c.getSnapshot().running,true); assert.match(c.getSnapshot().result,/100%/)
})
test('pause and resume exclude paused time; held keys block start; restart clears results', () => {
  let time=0; const c = new ScorePractice(()=>time); c.load(score([[60],[62]])); c.press('x',60); c.start(); assert.equal(c.getSnapshot().running,false); c.release('x'); c.start()
  time=2000; c.tick(); assert.equal(c.getSnapshot().seconds,2); c.pause(); time=8000; c.start(); time=9000; play(c,[60]); play(c,[62]); assert.equal(c.getSnapshot().seconds,3)
  c.reset(1); assert.equal(c.getSnapshot().runStart,1); assert.equal(c.getSnapshot().errors,0)
})
test('empty and rest-only scores cannot start; separate sources must both release', () => {
  const c=new ScorePractice(); c.load(score([[]])); c.start(); assert.equal(c.getSnapshot().running,false)
  c.load(score([[60],[60]])); c.start(); c.press('mouse',60); c.press('midi',60); c.release('mouse'); assert.equal(c.getSnapshot().index,0); c.release('midi'); assert.equal(c.getSnapshot().index,1)
})

test('timeline count-in and time progression continue through wrong notes and rests', () => {
  let now=0; const c=new ScorePractice(()=>now); c.load({...score([[60],[],[62]]),tempo:60}); c.setMode('timeline'); c.start()
  assert.equal(c.getSnapshot().beat,-4)
  play(c,[65]); assert.equal(c.getSnapshot().errors,0)
  now=4100; play(c,[65]); assert.equal(c.getSnapshot().errors,1); assert.equal(c.getSnapshot().running,true)
  now=5100; c.tick(); assert.equal(c.getSnapshot().missed,1); assert.ok(Math.abs(c.getSnapshot().beat - 1.1) < 1e-9)
  play(c,[64]); assert.equal(c.getSnapshot().errors,2)
  now=6200; play(c,[62]); now=7100; c.tick()
  assert.equal(c.getSnapshot().running,false); assert.equal(c.getSnapshot().completed,2); assert.equal(c.getSnapshot().firstTry,1)
})
test('timeline needs a new articulation for repeated notes; chords need simultaneous complete pitches', () => {
  let now=0; const c=new ScorePractice(()=>now); c.load({...score([[60],[60],[60,64]]),tempo:60}); c.setMode('timeline'); c.start()
  now=4100; c.press('a',60); now=6100; c.tick(); assert.equal(c.getSnapshot().firstTry,1); assert.equal(c.getSnapshot().missed,1)
  c.press('b',64); now=7100; c.tick(); assert.equal(c.getSnapshot().firstTry,2); assert.equal(c.getSnapshot().missed,1)
})
test('timeline pause and tempo changes retain beat even in trailing rests', () => {
  let now=0; const c=new ScorePractice(()=>now); c.load({...score([[60],[],[]]),tempo:60}); c.setMode('timeline'); c.start()
  now=5500; c.pause(); assert.equal(c.getSnapshot().beat,1.5); now=10000; c.setTempo(120); c.start(); now=10500; c.tick()
  assert.equal(c.getSnapshot().beat,2.5); assert.equal(c.getSnapshot().completed,1)
  now=11000; c.tick(); assert.equal(c.getSnapshot().running,false)
})
test('timeline range, mid-score count-in and looping preserve the previous result', () => {
  let now=0; const c=new ScorePractice(()=>now); c.load({...score([[60],[62],[64],[65],[67]]),tempo:60}); c.setMode('timeline'); c.configure(2,2,true); c.start()
  assert.equal(c.getSnapshot().startBeat,4); now=3000; play(c,[65]); assert.equal(c.getSnapshot().errors,0)
  now=4100; play(c,[67]); now=5100; c.tick(); assert.equal(c.getSnapshot().rounds,1); assert.equal(c.getSnapshot().beat,0); assert.match(c.getSnapshot().result,/命中 1/)
  c.configure(1,2,false); c.reset(2); assert.equal(c.getSnapshot().startBeat,2); c.start(); now=6000; play(c,[60]); assert.equal(c.getSnapshot().errors,0)
})
test('live pitch feedback exists while paused and persists until all owners release', () => {
  const c=new ScorePractice(); c.load(score()); c.press('mouse',60); c.press('midi',60); c.press('other',64)
  assert.deepEqual(c.getSnapshot().livePitches,[60,64]); c.release('mouse'); assert.deepEqual(c.getSnapshot().livePitches,[60,64]); c.release('midi'); assert.deepEqual(c.getSnapshot().livePitches,[64]); c.release('other'); assert.deepEqual(c.getSnapshot().livePitches,[])
})
