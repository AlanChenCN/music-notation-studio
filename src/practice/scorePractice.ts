import { createScore, measureBeats, scoreLength, type ScoreDocument, type ScoreEvent } from '../score/scoreModel'

export type TimelineEventResult = 'hit' | 'correct' | 'missed'
export const timelineRecognitionRadiusBeats = 0.5

/** Release-gated pitch practice and fixed-band timeline practice. Playback never enters this controller. */
export class ScorePractice {
  private listeners = new Set<() => void>()
  private held = new Map<string, number>()
  private matched = false
  private failed = false
  private targetErrors = 0
  private started = 0
  private elapsed = 0
  private anchorBeat = 0
  private state = { mode: 'step' as 'step' | 'timeline', tempo: 90, beat: 0, startBeat: 0, recognitionEventId: null as string | null, missed: 0, livePitches: [] as number[], liveWarningPitches: [] as number[], eventResults: {} as Record<string, TimelineEventResult>, score: createScore(), from: 1, to: 1, loop: false, running: false, index: 0, runStart: 0, completed: 0, firstTry: 0, errors: 0, rounds: 0, seconds: 0, message: '载入 Editor 保存的乐谱，或从 Editor 点击「去练习」。', result: '' }
  private now: () => number
  constructor(now = () => performance.now()) { this.now = now }

  private rangeStart() {
    return (this.state.from - 1) * measureBeats(this.state.score.timeSignature)
  }

  private rangeEnd() {
    return Math.min(scoreLength(this.state.score), this.state.to * measureBeats(this.state.score.timeSignature))
  }

  private eventWindow(event: ScoreEvent) {
    return {
      start: Math.max(this.rangeStart(), event.startBeat),
      end: Math.min(this.rangeEnd(), event.startBeat + event.duration),
    }
  }

  private recognitionTargetAt(beat: number, targets = this.targets(), results = this.state.eventResults) {
    if (beat < this.state.startBeat) return undefined
    return targets.slice(this.state.index).find(event => {
      const window = this.eventWindow(event)
      return !results[event.id]
        && window.start <= beat + timelineRecognitionRadiusBeats
        && window.end > beat - timelineRecognitionRadiusBeats
    })
  }

  private heldPitches() {
    return [...new Set(this.held.values())].sort((a, b) => a - b)
  }

  private timelineSummary(results: Record<string, TimelineEventResult>) {
    const settled = Object.values(results).filter(result => result === 'correct' || result === 'missed')
    const correct = settled.filter(result => result === 'correct').length
    return { completed: settled.length, correct, missed: settled.length - correct }
  }

  private warningPitches(event: ScoreEvent | undefined, results: Record<string, TimelineEventResult>) {
    if (!event || results[event.id] === 'hit' || results[event.id] === 'correct') return []
    return this.heldPitches().filter(pitch => !event.pitches.includes(pitch))
  }
  tick = () => {
    if (!this.state.running) return
    const seconds = Math.floor((this.elapsed + this.now() - this.started) / 1000)
    if (this.state.mode === 'step') { this.update({ seconds }); return }
    const end = this.rangeEnd() + timelineRecognitionRadiusBeats
    const beat = Math.min(end, this.anchorBeat + (this.now() - this.started) * this.state.tempo / 60000)
    const targets = this.targets()
    let eventResults = this.state.eventResults
    let { index } = this.state
    while (index < targets.length && this.eventWindow(targets[index]).end <= beat - timelineRecognitionRadiusBeats) {
      if (eventResults === this.state.eventResults) eventResults = { ...eventResults }
      eventResults[targets[index].id] = eventResults[targets[index].id] === 'hit' ? 'correct' : 'missed'
      index++
    }
    const summary = this.timelineSummary(eventResults)
    const current = this.recognitionTargetAt(beat, targets, eventResults)
    this.update({
      beat,
      seconds,
      index,
      recognitionEventId: current?.id ?? null,
      completed: summary.completed,
      firstTry: summary.correct,
      missed: summary.missed,
      eventResults,
      liveWarningPitches: this.warningPitches(current, eventResults),
    })
    if (beat >= end) {
      this.elapsed += this.now() - this.started
      const passRate = summary.completed ? Math.round(summary.correct / summary.completed * 100) : 0
      this.update({
        running: false,
        rounds: this.state.rounds + 1,
        result: `跟弹完成 ${summary.completed} 项 · 正确 ${summary.correct} 项 · 未通过 ${summary.missed} 项 · 通过率 ${passRate}% · ${seconds} 秒`,
        message: '本轮时间轴跟弹完成。',
      })
      if (this.state.loop) { this.reset(); this.begin() }
    }
  }
  setMode(mode: 'step' | 'timeline') {
    if (mode === this.state.mode) return
    this.pause(); this.update({ mode, result: '', rounds: 0 }); this.reset()
  }
  setTempo(tempo: number) {
    if (!Number.isFinite(tempo) || tempo < 30 || tempo > 240 || tempo === this.state.tempo) return
    this.pause(); this.update({ tempo })
  }
  private begin() {
    this.started = this.now(); this.anchorBeat = this.state.beat
    this.update({ running: true, message: this.state.mode === 'timeline' ? '时间轴跟弹 · 按顺序弹奏进入固定识别带的目标。' : '跟谱练习中 · 自由速度，休止符自动跳过' })
  }
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  getSnapshot = () => this.state
  private update(patch: Partial<typeof this.state>) { this.state = { ...this.state, ...patch }; this.listeners.forEach(fn => fn()) }
  targets() {
    const beats = measureBeats(this.state.score.timeSignature)
    return this.state.score.events.filter(e => e.pitches.length && e.startBeat < this.state.to * beats && e.startBeat + e.duration > (this.state.from - 1) * beats)
  }
  load(score: ScoreDocument) {
    this.pause(); this.held.clear()
    this.update({ score: structuredClone(score), tempo: score.tempo, recognitionEventId: null, livePitches: [], liveWarningPitches: [], from: 1, to: Math.max(1, Math.ceil(scoreLength(score) / measureBeats(score.timeSignature))), rounds: 0, result: '' })
    this.reset()
  }
  configure(from: number, to: number, loop: boolean) {
    const max = Math.max(1, Math.ceil(scoreLength(this.state.score) / measureBeats(this.state.score.timeSignature)))
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from || to > max) return
    if (from === this.state.from && to === this.state.to && loop === this.state.loop) return
    this.pause(); this.update({ from, to, loop, rounds: 0, result: '' }); this.reset()
  }
  reset(index = 0) {
    this.pause(); this.matched = false; this.failed = false; this.elapsed = 0; this.targetErrors = 0
    const beats = measureBeats(this.state.score.timeSignature)
    const start = index === 0 ? (this.state.from - 1) * beats : Math.max((this.state.from - 1) * beats, this.targets()[index]?.startBeat ?? 0)
    this.update({ startBeat: start, beat: start - (this.state.mode === 'timeline' ? beats : 0), recognitionEventId: null, missed: 0, liveWarningPitches: [], eventResults: {}, index, runStart: index, completed: 0, firstTry: 0, errors: 0, seconds: 0, message: this.targets().length ? (this.state.mode === 'timeline' ? '点击开始跟弹，预备一小节后按时间轴弹奏。' : '点击开始练习；弹对后全部松键进入下一项。') : '当前范围没有可练习音符。' })
  }
  start = () => {
    if (this.held.size || !this.targets().length || this.state.running) return
    const finished = this.state.mode === 'timeline' ? this.state.beat >= this.rangeEnd() + timelineRecognitionRadiusBeats : this.state.index >= this.targets().length
    if (finished) this.reset()
    this.begin()
  }
  pause = () => {
    if (this.state.mode === 'timeline' && this.state.running) this.tick()
    if (this.state.running) this.elapsed += this.now() - this.started
    this.matched = false; this.failed = false
    this.update({ running: false, seconds: Math.floor(this.elapsed / 1000) })
  }
  press(key: string, pitch: number) {
    if (this.held.has(key)) return
    if (this.state.mode === 'timeline') this.tick()
    this.held.set(key, pitch)
    const livePitches = this.heldPitches()
    this.update({ livePitches })
    if (this.state.mode === 'timeline') {
      if (!this.state.running) {
        this.update({ recognitionEventId: null, liveWarningPitches: [] })
        return
      }
      const targets = this.targets()
      const event = this.recognitionTargetAt(this.state.beat, targets)
      if (!event) {
        this.update({ recognitionEventId: null, liveWarningPitches: [] })
        return
      }
      const eventResults = { ...this.state.eventResults }
      const complete = event.pitches.every(targetPitch => livePitches.includes(targetPitch))
      if (event.pitches.includes(pitch) && complete) {
        eventResults[event.id] = 'hit'
        const next = this.recognitionTargetAt(this.state.beat, targets, eventResults)
        this.update({
          eventResults,
          recognitionEventId: next?.id ?? null,
          liveWarningPitches: this.warningPitches(next, eventResults),
          message: '当前目标已命中，可继续按顺序弹奏进入识别带的目标。',
        })
      } else {
        this.update({ recognitionEventId: event.id, liveWarningPitches: this.warningPitches(event, eventResults) })
      }
      return
    }
    if (!this.state.running) return
    const target = this.targets()[this.state.index]
    if (!target) return
    const pitches = [...new Set(this.held.values())]
    if (pitches.some(p => !target.pitches.includes(p))) {
      if (!this.failed) this.update({ errors: this.state.errors + 1 })
      this.failed = true; this.matched = false
      this.update({ message: '音高不匹配，请全部松键后重试。' })
    } else if (!this.failed && pitches.length === target.pitches.length) {
      this.matched = true; this.update({ message: '音高正确，全部松键后继续。' })
    }
  }
  release(key: string) {
    if (!this.held.delete(key)) return
    this.update({ livePitches: this.heldPitches() })
    if (this.state.mode === 'timeline') { this.tick(); return }
    if (this.held.size || !this.state.running) return
    if (!this.matched) {
      if (!this.failed) this.update({ errors: this.state.errors + 1 })
      this.failed = false
      this.update({ message: '请重新弹奏完整目标音高。' }); return
    }
    const completed = this.state.completed + 1
    const firstTry = this.state.firstTry + (this.targetErrors === this.state.errors ? 1 : 0)
    this.targetErrors = this.state.errors
    this.matched = false; this.failed = false
    const index = this.state.index + 1
    this.update({ index, completed, firstTry, message: '继续下一个目标。' })
    if (index >= this.targets().length) {
      this.pause()
      const result = `本轮完成 ${completed} 项 · 首次正确 ${Math.round(firstTry / completed * 100)}% · 错误 ${this.state.errors} 次 · ${this.state.seconds} 秒`
      this.update({ rounds: this.state.rounds + 1, result, message: '本轮练习完成。' })
      if (this.state.loop) { this.reset(); this.start() }
    }
  }
}
