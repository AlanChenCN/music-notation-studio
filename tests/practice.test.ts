import { describe, expect, it } from 'vitest'
import { createSession, defaultConfig, generateNotes, sessionReducer, type Session } from '../src/practice'

const start = (mode: 'reading' | 'rhythm' = 'reading') => sessionReducer(createSession(mode, defaultConfig, [60, 60]), { type: 'start', now: 0 })
const input = (state: Session, pitch: number, down: boolean, now = 0, key = `midi:a:${pitch}`) => sessionReducer(state, { type: 'input', pitch, down, now, key })
describe('自由速度识谱', () => {
  it('正确音必须全部松开才推进，连续同音需要重新触键', () => {
    let state = input(start(), 60, true)
    expect(state.index).toBe(0)
    state = input(state, 60, true)
    expect(state.index).toBe(0)
    state = input(state, 60, false)
    expect(state.index).toBe(1)
    expect(state.results).toEqual(['hit', 'pending'])
    state = input(input(state, 60, true), 60, false)
    expect(state.status).toBe('complete')
  })
  it('同一错误尝试不重复计数，额外音需要松开后重试', () => {
    let state = input(input(start(), 62, true), 64, true)
    expect(state.errors).toBe(1)
    state = input(input(input(state, 60, true), 62, false), 64, false)
    state = input(state, 60, false)
    expect(state.index).toBe(0)
    state = input(input(state, 60, true), 60, false)
    expect(state.index).toBe(1)
  })
  it('多输入源同音不会因一个来源释放而提前推进', () => {
    let state = input(start(), 60, true, 0, 'midi:a:60')
    state = input(state, 60, true, 0, 'midi:b:60')
    state = input(state, 60, false, 0, 'midi:a:60')
    expect(state.index).toBe(0)
    state = input(state, 60, false, 0, 'midi:b:60')
    expect(state.index).toBe(1)
  })
  it('暂停或断线不会将旧的命中自动推进', () => {
    let state = input(start(), 60, true)
    state = sessionReducer(state, { type: 'pause', now: 50 })
    state = sessionReducer(state, { type: 'release-source', source: 'midi', now: 50 })
    expect(state.held).toEqual({})
    state = sessionReducer(state, { type: 'start', now: 100 })
    state = input(state, 60, false)
    expect(state.index).toBe(0)
  })
})
describe('节拍跟弹', () => {
  it('四拍预备不计分，目标音在起音窗口内命中', () => {
    let state = input(start('rhythm'), 60, true, 1000)
    expect(state.results).toEqual(['pending', 'pending'])
    state = input(state, 60, false, 1100)
    state = input(state, 60, true, 3000)
    expect(state.results[0]).toBe('hit')
    state = sessionReducer(state, { type: 'tick', now: 4000 })
    expect(state.results).toEqual(['hit', 'miss'])
  })
  it('暂停时间不计入时间轴，恢复保留已结算结果', () => {
    let state = input(start('rhythm'), 60, true, 3000)
    state = input(state, 60, false, 3050)
    state = sessionReducer(state, { type: 'pause', now: 3100 })
    state = sessionReducer(state, { type: 'start', now: 10_000 })
    state = input(state, 60, true, 10_650)
    expect(state.results).toEqual(['hit', 'hit'])
    state = sessionReducer(state, { type: 'tick', now: 11_500 })
    expect(state.status).toBe('complete')
  })
  it('窗口外输入与错音不会变成命中', () => {
    let state = input(start('rhythm'), 62, true, 3000)
    state = input(state, 62, false, 3100)
    state = input(state, 60, true, 3350)
    expect(state.results[0]).toBe('miss')
    expect(state.errors).toBe(2)
  })
})
describe('随机短谱', () => {
  it('级进始终在可用音符间相邻移动，边界可以回转', () => {
    for (const pool of ['white', 'all'] as const) {
      const notes = generateNotes({ ...defaultConfig, strategy: 'stepwise', low: 60, high: 64, pool, length: 32 }, () => .99)
      const available = pool === 'white' ? [60, 62, 64] : [60, 61, 62, 63, 64]
      expect(notes).toHaveLength(32)
      notes.slice(1).forEach((note, i) => expect(Math.abs(available.indexOf(note) - available.indexOf(notes[i]))).toBe(1))
    }
  })
  it('跳进保持三度或五度，且不会落到范围外或重复同音', () => {
    for (const pool of ['white', 'all'] as const) {
      let seed = 3
      const notes = generateNotes({ ...defaultConfig, strategy: 'leaps', pool, length: 32 }, () => ((seed = (seed * 16807) % 2147483647) / 2147483647))
      const white = [60, 62, 64, 65, 67, 69, 71, 72]
      notes.forEach(note => expect(note >= 60 && note <= 72).toBe(true))
      notes.slice(1).forEach((note, i) => {
        const distance = pool === 'white' ? Math.abs(white.indexOf(note) - white.indexOf(notes[i])) : Math.abs(note - notes[i])
        expect(pool === 'white' ? [2, 4] : [3, 4, 7]).toContain(distance)
      })
    }
  })
  it('过窄音域明确报错，随机仍允许单音', () => {
    expect(() => generateNotes({ ...defaultConfig, strategy: 'stepwise', low: 60, high: 60 })).toThrow('至少需要两个')
    expect(() => generateNotes({ ...defaultConfig, strategy: 'leaps', low: 60, high: 62 })).toThrow('无法进行跳进')
    expect(generateNotes({ ...defaultConfig, low: 60, high: 60 })).toEqual(Array(16).fill(60))
  })
  it('遵循音域、白键范围及长度', () => {
    const notes = generateNotes({ ...defaultConfig, low: 61, high: 65, length: 32 }, () => .99)
    expect(notes).toHaveLength(32)
    expect(notes.every(pitch => [62, 64, 65].includes(pitch))).toBe(true)
    expect(generateNotes({ ...defaultConfig, low: 61, high: 61, pool: 'all' })).toEqual(Array(16).fill(61))
  })
  it('拒绝空白键音域', () => {
    expect(() => generateNotes({ ...defaultConfig, low: 61, high: 61 })).toThrow()
  })
})
