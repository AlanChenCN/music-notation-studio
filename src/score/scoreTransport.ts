import { scoreLength, type ScoreDocument } from './scoreModel'

interface Snapshot { beat: number; playing: boolean }
/** A monotonic clock: seeking rearticulates held notes and preserves play/pause. */
export class ScoreTransport {
  private score: ScoreDocument
  private snapshot: Snapshot = { beat: 0, playing: false }
  private listeners = new Set<() => void>()
  private sounding = new Map<string, number>()
  private anchorTime = 0
  private anchorBeat = 0
  private frameId: number | null = null
  private on: (pitch: number) => void
  private off: (pitch: number) => void
  private now: () => number
  constructor(score: ScoreDocument, on: (pitch: number) => void, off: (pitch: number) => void, now = () => performance.now()) {
    this.score = score; this.on = on; this.off = off; this.now = now
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  getSnapshot = () => this.snapshot
  private publish(beat: number, playing: boolean) {
    this.snapshot = { beat, playing }
    this.listeners.forEach(listener => listener())
  }
  private silence() { this.sounding.forEach(pitch => this.off(pitch)); this.sounding.clear() }
  private cancelTick() { if (this.frameId !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.frameId); this.frameId = null }
  private scheduleTick() {
    if (typeof requestAnimationFrame !== 'function' || this.frameId !== null) return
    this.frameId = requestAnimationFrame(() => {
      this.frameId = null
      this.tick()
    })
  }
  setScore(score: ScoreDocument) { this.pause(); this.score = score; this.seek(Math.min(this.snapshot.beat, scoreLength(score))) }
  play = () => {
    if (!scoreLength(this.score) || this.snapshot.playing) return
    this.anchorBeat = this.snapshot.beat >= scoreLength(this.score) ? 0 : this.snapshot.beat
    this.anchorTime = this.now()
    this.publish(this.anchorBeat, true); this.tick()
  }
  pause = () => { if (this.snapshot.playing) this.tick(); this.cancelTick(); this.silence(); this.publish(this.snapshot.beat, false) }
  stop = () => { this.cancelTick(); this.silence(); this.publish(0, false) }
  seek = (beat: number) => {
    this.silence()
    this.anchorBeat = Math.max(0, Math.min(beat, scoreLength(this.score)))
    this.anchorTime = this.now()
    this.publish(this.anchorBeat, this.snapshot.playing)
    if (this.snapshot.playing) this.tick()
  }
  tick = () => {
    if (!this.snapshot.playing) return
    const beat = Math.min(scoreLength(this.score), this.anchorBeat + (this.now() - this.anchorTime) * this.score.tempo / 60000)
    if (beat >= scoreLength(this.score)) { this.silence(); this.publish(beat, false); return }
    const event = this.score.events.find(item => beat >= item.startBeat && beat < item.startBeat + item.duration)
    const next = new Map((event?.pitches ?? []).map(pitch => [`${event!.id}:${pitch}`, pitch]))
    this.sounding.forEach((pitch, key) => { if (!next.has(key)) this.off(pitch) })
    next.forEach((pitch, key) => { if (!this.sounding.has(key)) this.on(pitch) })
    this.sounding = next
    this.publish(beat, true)
    this.scheduleTick()
  }
}
