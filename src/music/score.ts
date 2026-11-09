/** Format v1: integer ticks, 8 ticks per quarter note. Not a playback state. */
export const TICKS_PER_QUARTER = 8
export type Duration = { denominator: 1 | 2 | 4 | 8 | 16; dotted?: boolean }
export type Pitch = { step: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'; octave: number; alter: -1 | 0 | 1 }
export type ScoreNote = { id: string; pitch: Pitch; tieTo?: string }
export type ScoreEvent = { id: string; start: number; duration: Duration } & (
  { kind: 'notes'; notes: ScoreNote[] } | { kind: 'rest' }
)
export interface Voice {
  id: string
  clef: 'treble' | 'bass'
  suggestedHand?: 'left' | 'right'
  events: ScoreEvent[]
}
export interface Score {
  version: 1
  title: string
  meter: { numerator: 2 | 3 | 4 | 6; denominator: 4 | 8 }
  /** BPM always counts quarter notes, including in 6/8. */
  tempo: { quarterBpm: number }
  /** Signed circle-of-fifths count: -7 flats through +7 sharps. */
  keySignature: number
  measures: number
  voices: Voice[]
}
export const durationTicks = (duration: Duration) => 32 / duration.denominator * (duration.dotted ? 1.5 : 1)
export const measureTicks = (meter: Score['meter']) => meter.numerator * 32 / meter.denominator
const natural: Record<Pitch['step'], number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
/** Pitch.alter is absolute, not an instruction relative to the key signature. */
export const pitchToMidi = (pitch: Pitch) => (pitch.octave + 1) * 12 + natural[pitch.step] + pitch.alter
export function midiToPitch(midi: number): Pitch {
  if (!Number.isInteger(midi) || midi < 0 || midi > 127) throw new Error('MIDI 音高必须是 0–127 的整数。')
  const steps: Pitch['step'][] = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B']
  return { step: steps[midi % 12], alter: [1, 3, 6, 8, 10].includes(midi % 12) ? 1 : 0, octave: Math.floor(midi / 12) - 1 }
}

export interface ScoreIssue { path: string; message: string }
export class ScoreValidationError extends Error {
  readonly issues: ScoreIssue[]
  constructor(issues: ScoreIssue[]) {
    super(issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'))
    this.name = 'ScoreValidationError'
    this.issues = issues
  }
}
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value)

/** Validates unknown JSON without trusting TypeScript types or throwing on bad shapes. */
export function validateScore(value: unknown): ScoreIssue[] {
  const issues: ScoreIssue[] = []
  const fail = (path: string, message: string) => { issues.push({ path, message }) }
  if (!record(value)) return [{ path: '$', message: '乐谱必须是对象。' }]
  if (value.version !== 1) fail('version', '不支持的乐谱格式版本。')
  if (typeof value.title !== 'string') fail('title', '标题必须是文本。')
  const meter = value.meter
  const validMeter = record(meter) && ['2/4', '3/4', '4/4', '6/8'].includes(`${meter.numerator}/${meter.denominator}`) && integer(meter.numerator) && integer(meter.denominator)
  if (!validMeter) fail('meter', '拍号仅支持 2/4、3/4、4/4、6/8。')
  if (!record(value.tempo) || typeof value.tempo.quarterBpm !== 'number' || !Number.isFinite(value.tempo.quarterBpm) || value.tempo.quarterBpm <= 0) fail('tempo.quarterBpm', '四分音符 BPM 必须为有限正数。')
  if (!integer(value.keySignature) || Math.abs(value.keySignature) > 7) fail('keySignature', '调号必须是 -7 至 7 的整数。')
  if (!integer(value.measures) || value.measures <= 0) fail('measures', '小节数必须为正整数。')
  if (!Array.isArray(value.voices) || value.voices.length < 1 || value.voices.length > 2) {
    fail('voices', '首版支持一至两个记谱声部。')
    return issues
  }
  const bar = validMeter ? measureTicks(meter as Score['meter']) : 0
  const total = integer(value.measures) ? value.measures * bar : 0
  if (!Number.isSafeInteger(total)) fail('measures', '乐谱总时长超出精确计算范围。')
  const ids = new Set<string>()
  const id = (item: Record<string, unknown>, path: string) => {
    if (typeof item.id !== 'string' || !item.id.trim()) fail(`${path}.id`, '标识不能为空。')
    else if (ids.has(item.id)) fail(`${path}.id`, '标识必须在整份乐谱中唯一。')
    else ids.add(item.id)
  }
  const noteLinks: { note: ScoreNote; voice: number; start: number; end: number; path: string }[] = []
  value.voices.forEach((voice, vi) => {
    const vp = `voices[${vi}]`
    if (!record(voice)) { fail(vp, '声部必须是对象。'); return }
    id(voice, vp)
    if (!['treble', 'bass'].includes(String(voice.clef))) fail(`${vp}.clef`, '谱表必须为高音或低音。')
    if (voice.suggestedHand !== undefined && !['left', 'right'].includes(String(voice.suggestedHand))) fail(`${vp}.suggestedHand`, '建议用手必须为 left 或 right。')
    if (!Array.isArray(voice.events) || !voice.events.length) { fail(`${vp}.events`, '声部必须有事件，以休止符填补空拍。'); return }
    let cursor = 0
    voice.events.forEach((event, ei) => {
      const ep = `${vp}.events[${ei}]`
      if (!record(event)) { fail(ep, '事件必须是对象。'); return }
      id(event, ep)
      const validStart = integer(event.start) && event.start >= 0
      if (!validStart) fail(`${ep}.start`, '起点必须为非负整数 tick。')
      const d = event.duration
      const validDuration = record(d) && [1, 2, 4, 8, 16].includes(Number(d.denominator)) && typeof d.denominator === 'number' && (d.dotted === undefined || typeof d.dotted === 'boolean')
      const length = validDuration ? durationTicks(d as Duration) : 0
      if (!validDuration || length <= 0) fail(`${ep}.duration`, '时值必须为全至十六分音符，可带单附点。')
      if (validStart && length > 0) {
        const start = event.start as number
        if (start !== cursor) fail(`${ep}.start`, '声部事件必须连续且按时间排序，不允许空隙或重叠。')
        const end = start + length
        if (!Number.isSafeInteger(end)) fail(ep, '事件结束时间超出精确计算范围。')
        if (bar && Math.floor(start / bar) !== Math.floor((end - 1) / bar)) fail(ep, '跨小节事件需拆分，并用延音线连接音符。')
        if (bar && end > total) fail(ep, '事件超出乐谱末尾。')
        cursor = end
      }
      if (event.kind === 'rest') {
        if ('notes' in event) fail(`${ep}.notes`, '休止符不能包含音符。')
      } else if (event.kind === 'notes') {
        if (!Array.isArray(event.notes) || !event.notes.length) { fail(`${ep}.notes`, '音符事件至少需要一个音。'); return }
        const pitches = new Set<number>()
        event.notes.forEach((note, ni) => {
          const np = `${ep}.notes[${ni}]`
          if (!record(note)) { fail(np, '音符必须是对象。'); return }
          id(note, np)
          const p = note.pitch
          const validPitch = record(p) && Object.hasOwn(natural, String(p.step)) && integer(p.octave) && integer(p.alter) && [-1, 0, 1].includes(p.alter)
          if (!validPitch) { fail(`${np}.pitch`, '音高需包含音名、整数八度及 -1／0／1 变音。'); return }
          const midi = pitchToMidi(p as Pitch)
          if (midi < 0 || midi > 127) fail(`${np}.pitch`, '音高超出 MIDI 0–127 范围。')
          if (pitches.has(midi)) fail(`${np}.pitch`, '同一和弦不能重复同一琴键。')
          pitches.add(midi)
          if (note.tieTo !== undefined && (typeof note.tieTo !== 'string' || !note.tieTo)) fail(`${np}.tieTo`, '延音目标必须是音符标识。')
          if (validStart && length > 0) noteLinks.push({ note: note as ScoreNote, voice: vi, start: event.start as number, end: (event.start as number) + length, path: np })
        })
      } else fail(`${ep}.kind`, '事件类型必须为 notes 或 rest。')
    })
    if (bar && cursor !== total) fail(`${vp}.events`, '声部时长必须填满所有小节，请显式补休止符。')
  })
  const lookup = new Map(noteLinks.map(link => [link.note.id, link]))
  const incoming = new Set<string>()
  for (const source of noteLinks) {
    if (typeof source.note.tieTo !== 'string') continue
    const target = lookup.get(source.note.tieTo)
    if (!target || target.voice !== source.voice || target.start !== source.end || target.note.pitch.step !== source.note.pitch.step || target.note.pitch.octave !== source.note.pitch.octave || target.note.pitch.alter !== source.note.pitch.alter) fail(`${source.path}.tieTo`, '延音必须连接同声部紧邻且拼写相同的音符。')
    if (incoming.has(source.note.tieTo)) fail(`${source.path}.tieTo`, '一个音符不能接收多个延音来源。')
    incoming.add(source.note.tieTo)
  }
  return issues
}
export function assertScore(value: unknown): asserts value is Score {
  const issues = validateScore(value)
  if (issues.length) throw new ScoreValidationError(issues)
}
export function parseScore(json: string): Score {
  let value: unknown
  try { value = JSON.parse(json) } catch { throw new ScoreValidationError([{ path: '$', message: '乐谱 JSON 无法解析。' }]) }
  assertScore(value)
  return value
}
export function serializeScore(score: Score): string {
  assertScore(score)
  return JSON.stringify(score, null, 2)
}
