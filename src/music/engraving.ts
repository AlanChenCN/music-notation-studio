import { Accidental, Barline, Beam, Dot, Formatter, Fraction, Renderer, Stave, StaveConnector, StaveNote, StaveTie, Voice } from 'vexflow/bravura'
import { notation } from './notation'
import { stylePreviewBeam, stylePreviewNote } from './previewNotation'
import { measureEdgeInset, measureLeadingInset, noteAnchorOffset, practiceQuarterWidth, timeSpacing } from './spacing'
import { assertScore, durationTicks, measureTicks, pitchToMidi, TICKS_PER_QUARTER, type Score, type ScoreEvent } from './score'

const keys = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#']
export interface PreviewLayout { width: number; height: number; pitchGuides?: { middleC: number; gap: number; clef: 'treble' | 'bass' }[]; positions: { tick: number; x: number }[]; heads?: Map<number, Map<number, { x: number; y: number; rx: number; ry: number; tilt: number }>> }
const label = (event: ScoreEvent) => event.kind === 'notes' ? event.notes.map(note => `${note.pitch.step}${note.pitch.alter === 1 ? '♯' : note.pitch.alter === -1 ? '♭' : ''}${note.pitch.octave}`).join(' · ') : ''

/** Draw all bars in one horizontal strip. VexFlow aligns shared ticks across voices. */
export function drawScore(host: HTMLDivElement, score: Score, labels: boolean, availableHeight: number, availableWidth: number, leadIn = false): PreviewLayout {
  assertScore(score)
  host.replaceChildren()
  const barTicks = measureTicks(score.meter)
  const gap = 14
  const clefs = [...new Set(score.voices.map(voice => voice.clef))]
  const grand = clefs.includes('treble') && clefs.includes('bass')
  // Treble C4 is 9 staff spaces below its origin; bass C4 is 3 spaces below.
  // Sharing one C4 ordinate therefore puts the origins exactly 6 spaces apart.
  const staffY = (vi: number) => grand ? 24 + (score.voices[vi].clef === 'bass' ? 6 * gap : 0) : 24 + vi * 150
  const musicBottom = grand ? 24 + 14 * gap : 24 + (score.voices.length - 1) * 150 + 10 * gap
  const labelTop = musicBottom + 32
  const height = labelTop + (labels ? score.voices.length * 26 : 0) + 18
  const scale = Math.min(1.15, Math.max(.1, availableHeight / height))
  const quarter = practiceQuarterWidth(availableWidth) / scale
  const grids = Array.from({ length: score.measures }, (_, bar) => timeSpacing(score.voices.flatMap(voice => voice.events.filter(event => Math.floor(event.start / barTicks) === bar).map(event => event.start - bar * barTicks)), barTicks, quarter))
  const headerWidth = Math.max(...score.voices.map(voice => new Stave(0, 0, 500).addClef(voice.clef).addKeySignature(keys[score.keySignature + 7]).addTimeSignature(`${score.meter.numerator}/${score.meter.denominator}`).getNoteStartX()))
  const widths = grids.map((grid, bar) => grid.width + (bar === 0 && !leadIn ? headerWidth : 0))
  const leadInWidth = leadIn ? headerWidth + barTicks / TICKS_PER_QUARTER * quarter : 0
  const width = leadInWidth + widths.reduce((sum, w) => sum + w, 0) + 24
  const renderer = new Renderer(host, Renderer.Backends.SVG)
  renderer.resize(width * scale, height * scale)
  const ctx = renderer.getContext()
  ctx.scale(scale, scale)
  ctx.setFillStyle('currentColor').setStrokeStyle('currentColor')
  const noteMap = new Map<string, { rendered: StaveNote; index: number }>()
  const eventMap = new Map<string, StaveNote>()
  const heads: NonNullable<PreviewLayout['heads']> = new Map()
  const pitchGuides: NonNullable<PreviewLayout['pitchGuides']> = []
  const positions = new Map<number, number>()
  let x = 12
  if (leadIn) {
    const staves = score.voices.map((voice, i) => new Stave(x, staffY(i), leadInWidth, { spacingBetweenLinesPx: gap })
      .addClef(voice.clef)
      .addKeySignature(keys[score.keySignature + 7])
      .addTimeSignature(`${score.meter.numerator}/${score.meter.denominator}`)
      .setContext(ctx))
    staves.forEach(stave => stave.draw())
    if (grand && staves.length === 2) {
      const [upper, lower] = [...staves].sort((a, b) => a.getY() - b.getY())
      new StaveConnector(upper, lower).setType(StaveConnector.type.BRACE).setContext(ctx).draw()
    }
    x += leadInWidth
  }
  for (let bar = 0; bar < score.measures; bar++) {
    const barWidth = widths[bar]
    const staves: Stave[] = []
    const voices: Voice[] = []
    const allNotes: StaveNote[][] = []
    const barEvents: ScoreEvent[][] = []
    for (const [vi, voice] of score.voices.entries()) {
      const stave = new Stave(x, staffY(vi), barWidth, { spacingBetweenLinesPx: gap })
      if (bar === 0 && !leadIn) stave.addClef(voice.clef).addKeySignature(keys[score.keySignature + 7]).addTimeSignature(`${score.meter.numerator}/${score.meter.denominator}`)
      if (bar === score.measures - 1) stave.setEndBarType(Barline.type.END)
      stave.setDefaultLedgerLineStyle({ strokeStyle: 'currentColor', lineWidth: 1.4 })
      const events = voice.events.filter(event => Math.floor(event.start / barTicks) === bar)
      const notes = events.map(event => {
        const ordered = event.kind === 'notes' ? [...event.notes].sort((a, b) => pitchToMidi(a.pitch) - pitchToMidi(b.pitch)) : []
        const note = new StaveNote({
          clef: voice.clef, autoStem: true,
          keys: event.kind === 'rest' ? [voice.clef === 'bass' ? 'd/3' : 'b/4'] : ordered.map(n => `${n.pitch.step.toLowerCase()}${n.pitch.alter === 1 ? '#' : n.pitch.alter === -1 ? 'b' : ''}/${n.pitch.octave}`),
          duration: `${event.duration.denominator}${event.duration.dotted ? 'd' : ''}${event.kind === 'rest' ? 'r' : ''}`,
        })
        if (event.duration.dotted) Dot.buildAndAttach([note], { all: true })
        ordered.forEach((n, index) => noteMap.set(n.id, { rendered: note, index }))
        note.setStave(stave)
        eventMap.set(event.id, note)
        return note
      })
      const vfVoice = new Voice({ numBeats: score.meter.numerator, beatValue: score.meter.denominator }).addTickables(notes)
      // Each stave has its own accidental state, reset at every barline.
      Accidental.applyAccidentals([vfVoice], keys[score.keySignature + 7])
      if (bar === 0) pitchGuides.push({ middleC: (voice.clef === 'bass' ? stave.getYForLine(0) - gap : stave.getYForLine(4) + gap) * scale, gap: gap * scale, clef: voice.clef })
      staves.push(stave); voices.push(vfVoice); allNotes.push(notes); barEvents.push(events)
    }
    const noteStart = x + (barWidth - grids[bar].width)
    staves.forEach(stave => { stave.setNoteStartX(noteStart); stave.setContext(ctx).draw() })
    if (staves.length === 2 && staves[0].getY() !== staves[1].getY()) {
      const ordered = [...staves].sort((a, b) => a.getY() - b.getY())
      new StaveConnector(ordered[0], ordered[1]).setType(bar === 0 && !leadIn ? StaveConnector.type.BRACE : StaveConnector.type.SINGLE_LEFT).setContext(ctx).draw()
      new StaveConnector(staves[0], staves[1]).setType(StaveConnector.type.SINGLE_RIGHT).setContext(ctx).draw()
    }
    const beams = allNotes.flatMap(notes => Beam.generateBeams(notes, { groups: [new Fraction(score.meter.denominator === 8 ? 3 : 1, score.meter.denominator)], maintainStemDirections: false }))
    const formatter = new Formatter()
    voices.forEach(voice => formatter.joinVoices([voice]))
    formatter.format(voices)
    // Retain VexFlow modifier/chord preparation, replace its optical time spacing.
    const grid = grids[bar]
    const first = allNotes[0][0].getTickContext().getMetrics()
    const inset = measureLeadingInset(first.totalLeftPx)
    const last = Math.max(...barEvents.flatMap(events => events.map(event => grid.positions.get(event.start - bar * barTicks)!)))
    // Keep both edges inside the measure. Only dense bars need their onset grid compressed.
    const fit = last > 0 ? Math.min(1, Math.max(0, grid.width - inset - measureEdgeInset) / last) : 1
    barEvents.forEach(events => events.forEach(event => {
      const note = eventMap.get(event.id)!, context = note.getTickContext()
      const localOffset = note.getAbsoluteX() - context.getX()
      context.setX(noteStart + inset + grid.positions.get(event.start - bar * barTicks)! * fit - localOffset)
    }))
    // Shared pitch space can contain two independent rhythms at the same key.
    // Shift the lower staff's conflicting event sideways so both durations remain visible.
    if (grand && barEvents.length === 2) {
      const lower = score.voices[0].clef === 'bass' ? 0 : 1
      const upper = 1 - lower
      barEvents[lower].forEach(event => {
        if (event.kind !== 'notes') return
        const conflict = barEvents[upper].some(other => other.kind === 'notes' && other.start === event.start && other.notes.some(a => event.notes.some(b => pitchToMidi(a.pitch) === pitchToMidi(b.pitch))))
        if (conflict) eventMap.get(event.id)!.setXShift(-18)
      })
    }
    voices.forEach((voice, vi) => voice.draw(ctx, staves[vi]))
    beams.forEach(beam => beam.setContext(ctx).draw())
    const barAnchors = new Map<number, number>()
    barEvents.forEach((events, vi) => events.forEach(event => {
      const note = eventMap.get(event.id)!
      const px = note.getAbsoluteX() + noteAnchorOffset
      // A left-shifted voice must not move the shared time axis backwards.
      barAnchors.set(event.start, Math.max(barAnchors.get(event.start) ?? 0, px * scale))
      const element = note.getSVGElement()
      if (element) { element.dataset.eventId = event.id; element.dataset.kind = event.kind; element.dataset.tick = String(event.start); element.dataset.voice = String(vi); element.dataset.anchorX = String(note.getAbsoluteX()); element.dataset.durationTicks = String(durationTicks(event.duration)) }
      stylePreviewNote(note, event, beams.find(beam => beam.notes.includes(note)))
      if (element && event.kind === 'notes') {
        const atTick = heads.get(event.start) ?? new Map()
        const ordered = [...event.notes].sort((a, b) => pitchToMidi(a.pitch) - pitchToMidi(b.pitch))
        element.querySelectorAll('.preview-note-head').forEach((head, i) => {
          const pitch = pitchToMidi(ordered[i].pitch)
          if (atTick.has(pitch)) return
          const dimension = (name: string) => Number(head.getAttribute(name)) * scale
          atTick.set(pitch, { x: dimension('cx'), y: dimension('cy'), rx: dimension('rx'), ry: dimension('ry'), tilt: event.duration.denominator === 1 ? -6 : notation.tilt })
        })
        heads.set(event.start, atTick)
      }
      if (element && labels && event.kind === 'notes') {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.setAttribute('x', String(px)); text.setAttribute('y', String(labelTop + vi * 26)); text.setAttribute('text-anchor', 'middle'); text.setAttribute('class', 'preview-note-label')
        text.textContent = label(event)
        element.append(text)
      }
    }))
    for (const [tick, anchor] of barAnchors) positions.set(tick, anchor)
    host.querySelectorAll('.vf-beam').forEach(group => group.remove())
    beams.forEach(beam => stylePreviewBeam(host.querySelector('svg')!, beam))
    positions.set((bar + 1) * barTicks, (x + barWidth) * scale)
    x += barWidth
  }
  score.voices.forEach(voice => voice.events.forEach(event => {
    if (event.kind !== 'notes') return
    event.notes.forEach(note => {
      if (!note.tieTo) return
      const first = noteMap.get(note.id)!, last = noteMap.get(note.tieTo)!
      new StaveTie({ firstNote: first.rendered, lastNote: last.rendered, firstIndexes: [first.index], lastIndexes: [last.index] }).setContext(ctx).draw()
    })
  }))
  const svg = host.querySelector('svg')!
  svg.dataset.measureWidths = JSON.stringify(grids.map(grid => grid.width))
  if (leadIn) svg.dataset.leadIn = 'true'
  svg.dataset.headerWidth = String(headerWidth)
  svg.dataset.scoreTitle = score.title; svg.dataset.middleC = String(24 + 9 * gap); svg.dataset.continuousPitch = String(grand); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', `${score.title}，${score.voices.length} 个声部，${score.meter.numerator}/${score.meter.denominator}`)
  return { width: width * scale, height: height * scale, pitchGuides, heads, positions: [...positions].map(([tick, px]) => ({ tick, x: px })).sort((a, b) => a.tick - b.tick) }
}
export function cursorX(positions: PreviewLayout['positions'], tick: number): number {
  if (!positions.length) return 0
  const right = positions.findIndex(point => point.tick > tick)
  if (right === 0) return positions[0].x
  if (right === -1) return positions[positions.length - 1].x
  const a = positions[right - 1], b = positions[right]
  return a.x + (b.x - a.x) * (tick - a.tick) / (b.tick - a.tick)
}
