import { TICKS_PER_QUARTER } from './score'

export const practiceAnchor = { min: 110, ratio: .27 }

export const measureEdgeInset = 16
export const noteAnchorOffset = 6

export function measureLeadingInset(modifierWidth = 0) {
  return Math.max(measureEdgeInset, modifierWidth + 8)
}

export function practiceQuarterWidth(width: number) {
  return Math.max(62, Math.min(112, (width - 100) / 5))
}

export function timeSpacing(starts: number[], end: number, quarter: number) {
  const ticks = [...new Set([0, ...starts, end])].sort((a, b) => a - b)
  const offset = (tick: number) => tick / TICKS_PER_QUARTER * quarter
  return { positions: new Map(ticks.map(tick => [tick, offset(tick)])), width: offset(end) }
}
