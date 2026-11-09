import { assertScore, durationTicks, measureTicks, pitchToMidi, TICKS_PER_QUARTER, type Score } from './score'

export const onsetWindow = .3 * TICKS_PER_QUARTER
export const chordWindow = .15 * TICKS_PER_QUARTER

export function practiceTimeline(score: Score) {
  assertScore(score)
  const notes = new Map(score.voices.flatMap(voice => voice.events.flatMap(event => event.kind === 'notes'
    ? event.notes.map(note => [note.id, { note, start: event.start, end: event.start + durationTicks(event.duration) }] as const) : [])))
  const continuations = new Set([...notes.values()].flatMap(({ note }) => note.tieTo ? [note.tieTo] : []))
  const groups = new Map<number, Map<number, number>>()
  for (const { note, start, end } of notes.values()) {
    if (continuations.has(note.id)) continue
    let release = end, tie = note.tieTo
    while (tie) {
      const next = notes.get(tie)!
      release = next.end
      tie = next.note.tieTo
    }
    const pitches = groups.get(start) ?? new Map<number, number>()
    const pitch = pitchToMidi(note.pitch)
    pitches.set(pitch, Math.max(pitches.get(pitch) ?? release, release))
    groups.set(start, pitches)
  }
  return { end: measureTicks(score.meter) * score.measures, targets: [...groups].sort(([a], [b]) => a - b).map(([start, pitches]) => ({ start, pitches })) }
}

type Target = ReturnType<typeof practiceTimeline>['targets'][number]
type Press = { pitch: number; tick: number }
type Assignment = Press & { key: string; end: number }
export type TargetResult = { status: 'pending' | 'hit' | 'miss'; onsets: Map<number, number> }

/** Clock-independent practice engine. Inputs use score ticks, after any count-in. */
export class PracticeEngine {
  readonly timeline: ReturnType<typeof practiceTimeline>
  readonly results: TargetResult[]
  readonly held = new Map<string, Press>()
  readonly earlyReleases: { pitch: number; remaining: number }[] = []
  private readonly sounding = new Map<string, Assignment>()
  private readonly readingKeys = new Set<string>()
  index = 0
  errors = 0
  matched = false
  complete = false

  constructor(score: Score, readonly mode: 'reading' | 'rhythm') {
    this.timeline = practiceTimeline(score)
    this.results = this.timeline.targets.map(() => ({ status: 'pending', onsets: new Map() }))
    this.complete = mode === 'reading' && !this.results.length
  }

  advance(tick: number) {
    if (this.mode !== 'rhythm' || this.complete) return
    this.timeline.targets.forEach((target, i) => {
      if (this.results[i].status === 'pending' && (tick >= this.timeline.end || tick > target.start + onsetWindow)) this.results[i].status = 'miss'
    })
    this.complete = tick >= this.timeline.end
  }

  input(key: string, pitch: number, down: boolean, tick: number) {
    this.advance(tick)
    if (down) {
      if (this.held.has(key)) return
      this.held.set(key, { pitch, tick })
    } else {
      if (!this.held.delete(key)) return
      const assignment = this.sounding.get(key)
      if (this.mode === 'rhythm' && assignment && tick < assignment.end) this.earlyReleases.push({ pitch: assignment.pitch, remaining: assignment.end - tick })
      this.sounding.delete(key)
      this.readingKeys.delete(key)
    }
    if (this.complete) return
    if (this.mode === 'reading') this.read(key, down)
    else if (down && tick >= 0) this.follow(key, pitch, tick)
  }

  private read(key: string, down: boolean) {
    const target = this.timeline.targets[this.index]
    if (!this.matched) {
      if (down) this.readingKeys.add(key)
      const active = [...this.held].filter(([id]) => !this.sounding.has(id))
      if (active.some(([, press]) => !target.pitches.has(press.pitch))) {
        if (down && !target.pitches.has(this.held.get(key)!.pitch)) this.errors++
        return
      }
      const matches = [...target.pitches].map(([pitch, end]) => ({ pitch, end, key: active.find(([id, press]) => this.readingKeys.has(id) && press.pitch === pitch)?.[0] }))
      if (!matches.every(match => match.key !== undefined)) return
      for (const match of matches) this.sounding.set(match.key!, { ...match, key: match.key!, tick: target.start })
      this.matched = true
    } else if (down) {
      this.errors++
    }
    if ([...this.held.keys()].some(id => !this.sounding.has(id))) return
    const next = this.timeline.targets[this.index + 1]
    const boundary = next?.start ?? this.timeline.end
    if ([...this.sounding.values()].some(note => note.end <= boundary || next?.pitches.has(note.pitch))) return
    this.results[this.index].status = 'hit'
    this.readingKeys.clear()
    this.matched = false
    if (next) this.index++
    else this.complete = true
  }

  private follow(key: string, pitch: number, tick: number) {
    const candidates = this.timeline.targets.map((target, index) => ({ target, index }))
      .filter(({ target, index }) => this.results[index].status === 'pending' && target.pitches.has(pitch) && !this.results[index].onsets.has(pitch) && Math.abs(tick - target.start) <= onsetWindow)
      .sort((a, b) => Math.abs(a.target.start - tick) - Math.abs(b.target.start - tick))
    const candidate = candidates[0]
    if (!candidate) { this.errors++; return }
    const { target, index } = candidate
    const result = this.results[index]
    const ticks = [...result.onsets.values()].map(offset => target.start + offset)
    if (ticks.length && Math.max(tick, ...ticks) - Math.min(tick, ...ticks) > chordWindow) { this.errors++; return }
    result.onsets.set(pitch, tick - target.start)
    this.assign(key, pitch, tick, target)
    if (result.onsets.size === target.pitches.size) result.status = 'hit'
  }

  private assign(key: string, pitch: number, tick: number, target: Target) {
    this.sounding.set(key, { key, pitch, tick, end: target.pitches.get(pitch)! })
  }

  /** A disconnected input cannot count as a successful release. */
  releaseSource(source: string) {
    const keys = [...this.held.keys()].filter(key => key.startsWith(`${source}:`))
    if (!keys.length) return
    keys.forEach(key => { this.held.delete(key); this.sounding.delete(key) })
    this.cancelAttempt()
  }

  cancelAttempt() {
    this.matched = false
    this.readingKeys.clear()
    this.sounding.clear()
    for (const result of this.results) if (result.status === 'pending') result.onsets.clear()
  }
}
