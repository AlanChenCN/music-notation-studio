import type { Beam, StaveNote } from 'vexflow/bravura'
import type { ScoreEvent } from './score'
import { flagPaths, headTangent, notation, restMarks, svgMark } from './notation'

/** Keep VexFlow spacing and modifiers, replace only the visual notation marks. */
export function stylePreviewNote(note: StaveNote, event: ScoreEvent, beam?: Beam) {
  const element = note.getSVGElement()
  if (!element) return
  element.querySelectorAll('.vf-stem,.vf-flag').forEach(mark => mark.remove())
  element.querySelectorAll(':scope > path').forEach(mark => mark.remove())
  const ledgers = new Map<number, { left: number; right: number }>()
  const stave = note.getStave()!, top = stave.getYForLine(0), bottom = stave.getYForLine(4), gap = (bottom - top) / 4
  const down = note.getStemDirection() === -1
  const stemX = note.getStemX(), tangent = headTangent()
  const joins: number[] = []
  note.noteHeads.forEach(head => {
    const group = head.getSVGElement(), glyph = group?.querySelector(':scope > text')
    if (!group || !glyph) return
    const originalX = head.getAbsoluteX() + head.getWidth() / 2, y = head.getY()
    if (event.kind === 'rest') {
      const rest = svgMark('g', { class: 'rounded-rest', transform: `translate(${originalX} ${y})` })
      rest.append(...restMarks(event.duration.denominator)); glyph.replaceWith(rest)
      return
    }
    const whole = event.duration.denominator === 1
    // Adjacent chord heads alternate across a shared spine, with exact tangency.
    const side = originalX < stemX ? 1 : -1
    const x = whole ? originalX : stemX - side * tangent.x
    const radius = whole ? notation.head + 2 : notation.head
    const extent = radius + notation.stem / 2 + 5
    const addLedger = (ly: number) => {
      const previous = ledgers.get(ly)
      ledgers.set(ly, { left: Math.min(previous?.left ?? Infinity, x - extent), right: Math.max(previous?.right ?? -Infinity, x + extent) })
    }
    for (let ly = top - gap; ly >= y - .01; ly -= gap) addLedger(ly)
    for (let ly = bottom + gap; ly <= y + .01; ly += gap) addLedger(ly)
    joins.push(y + side * tangent.y)
    const ellipse = svgMark('ellipse', { cx: x, cy: y, rx: whole ? notation.head + 2 : notation.head, ry: notation.head * notation.ratio, transform: `rotate(${whole ? -6 : notation.tilt} ${x} ${y})`, class: `preview-note-head ${event.duration.denominator <= 2 ? 'hollow' : 'solid'}`, 'data-pitch-y': y })
    // Dot and accidental glyphs live in the same group and must survive replacement.
    glyph.replaceWith(ellipse)
  })
  ledgers.forEach(({ left, right }, y) => element.prepend(svgMark('line', { class: 'rounded-ledger', x1: left, x2: right, y1: y, y2: y, stroke: 'currentColor', 'stroke-width': 1.4, 'stroke-linecap': 'round' })))
  if (event.kind === 'rest' || event.duration.denominator === 1) return
  const start = down ? Math.min(...joins) : Math.max(...joins)
  const end = beam ? beam.getSlopeY(stemX, beam.notes[0].getStemX(), beam.getBeamYToDraw(), beam.slope) : (down ? Math.max(...joins) + 42 : Math.min(...joins) - 42)
  const stem = svgMark('line', { class: 'rounded-stem', x1: stemX, x2: stemX, y1: start, y2: end, stroke: 'currentColor', 'stroke-width': notation.stem, 'stroke-linecap': 'round' })
  element.prepend(stem)
  if (!beam && event.duration.denominator >= 8) {
    const flag = svgMark('g', { class: 'rounded-flag', transform: `translate(${stemX} ${end})${down ? ' rotate(180)' : ''}` })
    flagPaths(event.duration.denominator === 16 ? 2 : 1).forEach(d => {
      flag.append(svgMark('path', { d, fill: 'none', stroke: 'currentColor', 'stroke-width': notation.stem, 'stroke-linecap': 'round' }))
    })
    element.prepend(flag)
  }
}

let beamClipId = 0
export function stylePreviewBeam(svg: SVGSVGElement, beam: Beam) {
  const notes = [...beam.notes].sort((a, b) => a.getStemX() - b.getStemX())
  const first = beam.notes[0], direction = beam.getStemDirection(), half = notation.stem / 2
  const defs = svgMark('defs', {})
  svg.append(defs)
  // Each note owns its adjacent half-spans, inheriting that note's feedback color.
  // Clip outer round caps at the actual stem edges, including sloping beams.
  notes.forEach((note, i) => {
    const left = i ? (notes[i - 1].getStemX() + note.getStemX()) / 2 : note.getStemX() - half
    const right = i < notes.length - 1 ? (note.getStemX() + notes[i + 1].getStemX()) / 2 : note.getStemX() + half
    const id = `notation-beam-${++beamClipId}`
    const clip = svgMark('clipPath', { id, clipPathUnits: 'userSpaceOnUse' })
    clip.append(svgMark('rect', { x: left, y: -10000, width: right - left, height: 20000 }))
    defs.append(clip)
    const group = svgMark('g', { class: 'rounded-beam', 'clip-path': `url(#${id})`, 'data-left': left, 'data-right': right })
    for (const [level, duration] of ['4', '8'].entries()) {
      for (const segment of beam.getBeamLines(duration)) {
        if (segment.end === undefined) continue
        const start = Math.min(segment.start, segment.end), end = Math.max(segment.start, segment.end)
        if (end + half < left || start - half > right) continue
        const y = beam.getSlopeY(start, first.getStemX(), beam.getBeamYToDraw(), beam.slope) + level * notation.beamGap * direction
        group.append(svgMark('path', { d: `M${start} ${y} L${end} ${y + (end - start) * beam.slope}`, fill: 'none', stroke: 'currentColor', 'stroke-width': notation.beam, 'stroke-linecap': 'round' }))
      }
    }
    note.getSVGElement()?.append(group)
  })
}
