import { describe, expect, it } from 'vitest'
import { assertScore, durationTicks, measureTicks, midiToPitch, parseScore, pitchToMidi, serializeScore, validateScore, type Score } from '../src/music/score'
import { foundationScore, compoundScore, scoreExamples, workoutScores } from '../src/music/examples'
import { singleNotesToScore, scoreToSingleNotes } from '../src/music/adapter'
import { createSession, defaultConfig } from '../src/practice'

const copy = () => structuredClone(foundationScore)
const invalid = (edit: (score: Score) => void, message: string) => { const score = copy(); edit(score); expect(validateScore(score).some(issue => issue.message.includes(message))).toBe(true) }

describe('乐谱模型与序列化', () => {
  it('验证谱例包含双声部、和弦、休止、附点和跨小节部分延音，往返无损', () => {
    [...scoreExamples, ...workoutScores.map(item => item.score)].forEach(score => { expect(validateScore(score)).toEqual([]); expect(parseScore(serializeScore(score))).toEqual(score) })
    expect(compoundScore.meter).toEqual({ numerator: 6, denominator: 8 })
  })
  it('全部基础时值和单附点用整数表示，所有拍号小节长度准确', () => {
    for (const denominator of [1, 2, 4, 8, 16] as const) {
      expect(Number.isInteger(durationTicks({ denominator, dotted: true }))).toBe(true)
      expect(durationTicks({ denominator, dotted: true })).toBe(durationTicks({ denominator }) * 1.5)
    }
    for (const [numerator, denominator, length] of [[2, 4, 16], [3, 4, 24], [4, 4, 32], [6, 8, 24]] as const) expect(measureTicks({ numerator, denominator })).toBe(length)
  })
  it('保留等音拼写，调号不会再次叠加到演奏音高', () => {
    expect(pitchToMidi({ step: 'C', alter: 1, octave: 4 })).toBe(61)
    expect(pitchToMidi({ step: 'D', alter: -1, octave: 4 })).toBe(61)
    for (let midi = 0; midi <= 127; midi++) expect(pitchToMidi(midiToPitch(midi))).toBe(midi)
  })
  it('任意错误 JSON 形状都给出校验结果而非类型异常', () => {
    for (const value of [null, [], {}, { ...copy(), voices: [null] }, { ...copy(), voices: [{ id: 'v', clef: 'bass', events: [null, { kind: 'notes', notes: [null] }] }] }]) expect(validateScore(value).length).toBeGreaterThan(0)
    expect(() => parseScore('{')).toThrow('JSON')
    expect(() => parseScore(JSON.stringify({ ...copy(), version: 2 }))).toThrow('版本')
  })
  it('拒绝重复标识、空和弦、重复琴键和越界音高', () => {
    invalid(s => { s.voices[1].id = s.voices[0].id }, '唯一')
    invalid(s => { const e = s.voices[0].events[0]; if (e.kind === 'notes') e.notes = [] }, '至少需要一个音')
    invalid(s => { const e = s.voices[0].events[4]; if (e.kind === 'notes') e.notes[1].pitch = e.notes[0].pitch }, '重复同一琴键')
    invalid(s => { const e = s.voices[0].events[0]; if (e.kind === 'notes') e.notes[0].pitch.octave = 20 }, 'MIDI')
  })
  it('拒绝事件空隙、重叠、跨小节和不完整小节', () => {
    invalid(s => { s.voices[0].events[1].start++ }, '连续')
    invalid(s => { s.voices[0].events[1].start-- }, '重叠')
    invalid(s => { s.voices[0].events[4].duration.denominator = 2 }, '跨小节')
    invalid(s => { s.voices[0].events.pop() }, '填满')
  })
  it('延音必须是相邻同声部同拼写目标，不能跨空拍或指向自身', () => {
    invalid(s => { const e = s.voices[0].events[4]; if (e.kind === 'notes') e.notes[0].tieTo = 'missing' }, '延音')
    invalid(s => { const e = s.voices[0].events[4]; if (e.kind === 'notes') e.notes[0].tieTo = 'a5-g' }, '延音')
    invalid(s => { const e = s.voices[0].events[4]; if (e.kind === 'notes') e.notes[0].tieTo = 'b2-n0' }, '延音')
    invalid(s => { const e = s.voices[0].events[5]; if (e.kind === 'notes') e.notes[0].pitch.alter = 1 }, '延音')
  })
  it('拒绝首版以外的声部、拍号、时值和无效速度', () => {
    invalid(s => { s.voices.push(structuredClone(s.voices[0])) }, '一至两个')
    invalid(s => { s.meter.denominator = 8 }, '拍号')
    invalid(s => { s.tempo.quarterBpm = Infinity }, 'BPM')
    const score: unknown = { ...copy(), voices: [{ id: 'v', clef: 'bass', events: [{ id: 'e', kind: 'rest', start: 0, duration: { denominator: 32 } }] }] }
    expect(() => assertScore(score)).toThrow('时值')
  })
})

describe('现有单音练习适配', () => {
  it('不足一小节补显式休止，原题数量和音高不变', () => {
    const score = singleNotesToScore([60, 61], { clef: 'bass', bpm: 80 })
    expect(validateScore(score)).toEqual([])
    expect(score.voices[0].events).toHaveLength(4)
    expect(scoreToSingleNotes(score)).toEqual([60, 61])
    const session = createSession('reading', defaultConfig, [60, 61])
    expect(session.notes).toEqual([60, 61])
    expect(session.score.voices[0].events[0].start).toBe(0)
    expect(() => singleNotesToScore([], { clef: 'treble', bpm: 80 })).toThrow('不能为空')
  })
  it('拒绝将尚不支持的和弦、混合时值和多声部静默压平', () => {
    expect(() => scoreToSingleNotes(foundationScore)).toThrow()
    expect(() => scoreToSingleNotes(compoundScore)).toThrow()
  })
})
