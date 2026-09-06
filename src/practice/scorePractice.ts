import { createScore, measureBeats, scoreLength, type ScoreDocument } from '../score/scoreModel'

/** Release-gated pitch practice. Playback never enters this controller. */
export class ScorePractice {
  private listeners = new Set<() => void>()
  private held = new Map<string, number>()
  private matched = false
  private failed = false
  private targetErrors = 0
  private started = 0
  private elapsed = 0
  private state = { score: createScore(), from: 1, to: 1, loop: false, running: false, index: 0, runStart: 0, completed: 0, firstTry: 0, errors: 0, rounds: 0, seconds: 0, message: '载入 Editor 保存的乐谱，或从 Editor 点击「去练习」。', result: '' }
  private now: () => number
  constructor(now = () => performance.now()) { this.now = now }
  tick = () => { if (this.state.running) this.update({ seconds: Math.floor((this.elapsed + this.now() - this.started) / 1000) }) }
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  getSnapshot = () => this.state
  private update(patch: Partial<typeof this.state>) { this.state = { ...this.state, ...patch }; this.listeners.forEach(fn => fn()) }
  targets() {
    const beats = measureBeats(this.state.score.timeSignature)
    return this.state.score.events.filter(e => e.pitches.length && e.startBeat < this.state.to * beats && e.startBeat + e.duration > (this.state.from - 1) * beats)
  }
  load(score: ScoreDocument) {
    this.pause(); this.held.clear()
    this.update({ score: structuredClone(score), from: 1, to: Math.max(1, Math.ceil(scoreLength(score) / measureBeats(score.timeSignature))), rounds: 0, result: '' })
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
    this.update({ index, runStart: index, completed: 0, firstTry: 0, errors: 0, seconds: 0, message: this.targets().length ? '点击开始练习；弹对后全部松键进入下一项。' : '当前范围没有可练习音符。' })
  }
  start = () => {
    if (this.held.size || !this.targets().length || this.state.running) return
    if (this.state.index >= this.targets().length) this.reset()
    this.started = this.now(); this.update({ running: true, message: '跟谱练习中 · 自由速度，休止符自动跳过' })
  }
  pause = () => {
    if (this.state.running) this.elapsed += this.now() - this.started
    this.matched = false; this.failed = false
    this.update({ running: false, seconds: Math.floor(this.elapsed / 1000) })
  }
  press(key: string, pitch: number) {
    this.held.set(key, pitch)
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
