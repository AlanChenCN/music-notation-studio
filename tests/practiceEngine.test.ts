import { expect, test } from 'vitest'
import { PracticeEngine, practiceTimeline } from '../src/music/practiceEngine'
import { foundationScore } from '../src/music/examples'
import { midiToPitch, type Score } from '../src/music/score'

const score: Score = {
  version: 1, title: '交叠与休止', meter: { numerator: 4, denominator: 4 }, tempo: { quarterBpm: 80 }, keySignature: 0, measures: 1,
  voices: [
    { id: 'upper', clef: 'treble', events: [
      { id: 'chord', kind: 'notes', start: 0, duration: { denominator: 4 }, notes: [60, 64].map(pitch => ({ id: `n${pitch}`, pitch: midiToPitch(pitch) })) },
      { id: 'rest', kind: 'rest', start: 8, duration: { denominator: 4 } },
      { id: 'next', kind: 'notes', start: 16, duration: { denominator: 2 }, notes: [{ id: 'n67', pitch: midiToPitch(67) }] },
    ] },
    { id: 'lower', clef: 'bass', events: [{ id: 'bass', kind: 'notes', start: 0, duration: { denominator: 1 }, notes: [{ id: 'n48', pitch: midiToPitch(48) }] }] },
  ],
}

test('识谱不限和弦按齐速度，松开结束音后跨过休止，长音可继续按住', () => {
  const engine = new PracticeEngine(score, 'reading')
  engine.input('m:48', 48, true, 0)
  engine.input('m:60', 60, true, 50)
  engine.input('m:61', 61, true, 100)
  engine.input('m:64', 64, true, 150)
  expect(engine.matched).toBe(false)
  engine.input('m:61', 61, false, 200)
  expect(engine.matched).toBe(true)
  engine.input('m:60', 60, false, 201)
  expect(engine.index).toBe(0)
  engine.input('m:64', 64, false, 202)
  expect(engine.timeline.targets[engine.index].start).toBe(16)
  expect(engine.held.has('m:48')).toBe(true)
  engine.input('m:67', 67, true, 203)
  engine.input('m:67', 67, false, 204)
  expect(engine.complete).toBe(false)
  engine.input('m:48', 48, false, 205)
  expect(engine.complete).toBe(true)
})

test('跟弹记录和弦完整性、起音偏差、休止误弹与提前释放', () => {
  const engine = new PracticeEngine(score, 'rhythm')
  engine.input('m:48', 48, true, 0)
  engine.input('m:60', 60, true, .4)
  engine.input('m:64', 64, true, 1.3)
  engine.advance(3)
  expect(engine.results[0].status).toBe('miss')
  expect([...engine.results[0].onsets.values()]).toEqual([0, .4])
  engine.input('m:60', 60, false, 4)
  expect(engine.earlyReleases).toEqual([{ pitch: 60, remaining: 4 }])
  engine.input('m:70', 70, true, 10)
  expect(engine.errors).toBe(2)
  engine.input('m:67', 67, true, 16)
  expect(engine.results[1].status).toBe('hit')
})

test('跨小节延音合并成一次起音，断线不算成功松键', () => {
  const { targets } = practiceTimeline(foundationScore)
  expect(targets.find(target => target.start === 24)?.pitches.get(67)).toBe(48)
  expect(targets.find(target => target.start === 32)?.pitches.has(67)).toBe(false)
  const engine = new PracticeEngine(score, 'reading')
  for (const pitch of [48, 60, 64]) engine.input(`m:${pitch}`, pitch, true, 0)
  expect(engine.matched).toBe(true)
  engine.releaseSource('m')
  expect(engine.index).toBe(0)
  expect(engine.results[0].status).toBe('pending')
  expect(engine.held.size).toBe(0)
})

test('预备拍不评分，谱尾的十六分音符也会结算', () => {
  const finalSixteenth: Score = { ...score, voices: [{ id: 'upper', clef: 'treble', events: [
    { id: 'first', kind: 'notes', start: 0, duration: { denominator: 4 }, notes: [{ id: 'n60', pitch: midiToPitch(60) }] },
    ...([[8, 2], [24, 8], [28, 16]] as const).map(([start, denominator]) => ({ id: `rest-${start}`, kind: 'rest' as const, start, duration: { denominator } })),
    { id: 'last', kind: 'notes', start: 30, duration: { denominator: 16 }, notes: [{ id: 'n64', pitch: midiToPitch(64) }] },
  ] }] }
  const engine = new PracticeEngine(finalSixteenth, 'rhythm')
  engine.input('m:60', 60, true, -1)
  engine.input('m:60', 60, false, -.5)
  expect(engine.results[0].status).toBe('pending')
  engine.advance(32)
  expect(engine.complete).toBe(true)
  expect(engine.results.map(result => result.status)).toEqual(['miss', 'miss'])
})
