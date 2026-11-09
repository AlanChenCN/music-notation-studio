/** Rounded notation, design revision 7. All dimensions use a 14px staff gap. */
export const notation = { head: 8, ratio: .69, tilt: -12, stem: 3, beam: 3, beamGap: 11, flagGap: 11 } as const

export function headTangent(radius = notation.head as number, side = 1) {
  const b = radius * notation.ratio, t = notation.tilt * Math.PI / 180
  const x = Math.hypot(radius * Math.cos(t), b * Math.sin(t))
  return { x: side * x, y: side * (radius * radius - b * b) * Math.sin(t) * Math.cos(t) / x }
}

/** Single round-ended diagonal per flag, matching the stem width. */
export function flagPaths(count: number) {
  return Array.from({ length: count }, (_, i) => `M0 ${i * notation.flagGap} L16 ${i * notation.flagGap + 9}`)
}

export function svgMark<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag)
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)))
  return element
}

export function restMarks(denominator: number) {
  if (denominator <= 2) return [svgMark('rect', { x: -10, y: denominator === 1 ? 0 : -6, width: 20, height: 6, rx: 2, fill: 'currentColor', stroke: 'none' })]
  if (denominator === 4) return [svgMark('path', { d: 'M-4 -25 Q7 -18 -3 -9 L8 4 Q-10 -3 -3 15', fill: 'none', stroke: 'currentColor', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })]
  const line = (x1: number, y1: number, x2: number, y2: number) => svgMark('line', { x1, y1, x2, y2, stroke: 'currentColor', 'stroke-width': notation.stem, 'stroke-linecap': 'round' })
  const marks: SVGElement[] = [line(8, -18, -3, 20)]
  for (let i = 0; i < (denominator === 16 ? 2 : 1); i++) {
    const x = -3 - i * 3, y = -11 + i * 11
    const joinY = y + 3, joinX = 8 - (joinY + 18) * 11 / 38
    marks.push(line(x, y, joinX, joinY), svgMark('circle', { cx: x, cy: y, r: 4, fill: 'currentColor', stroke: 'none' }))
  }
  return marks
}
