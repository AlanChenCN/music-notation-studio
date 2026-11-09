import { expect, test } from 'vitest'
import { practiceQuarterWidth, timeSpacing } from '../src/music/spacing'

test('延续原练习的屏宽基准', () => {
  expect([320, 500, 1200].map(practiceQuarterWidth)).toEqual([62, 80, 112])
})

test('所有时值及附点严格按比例，不设下限', () => {
  for (const denominator of [1, 2, 4, 8, 16]) {
    const { positions, width } = timeSpacing(Array.from({ length: denominator }, (_, i) => i * 32 / denominator), 32, 62)
    expect(width).toBe(248)
    expect(positions.get(32 / denominator)).toBe(248 / denominator)
  }
  expect(timeSpacing([0, 0, 12], 32, 80).positions.get(12)).toBe(120)
})
