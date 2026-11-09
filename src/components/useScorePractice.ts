import { useEffect, useRef, useState, type RefObject } from 'react'
import type { MidiNote } from '../midi'
import { PracticeEngine } from '../music/practiceEngine'
import { TICKS_PER_QUARTER, type Score } from '../music/score'

export type ScoreMode = 'reading' | 'rhythm'
export type ScorePracticeInput = { input: (note: MidiNote, now: number) => void; release: (source: string) => void; pause: () => void }

export function useScorePractice(score: Score, mode: ScoreMode | null, inputRef: RefObject<ScorePracticeInput | null>) {
  const initialTick = mode === 'rhythm' ? -4 * TICKS_PER_QUARTER : 0
  const rate = score.tempo.quarterBpm * TICKS_PER_QUARTER / 60_000
  const engine = useRef<PracticeEngine | null>(null)
  const clock = useRef({ tick: initialTick, started: 0, running: false })
  const [view, setView] = useState({ tick: initialTick, running: false, complete: false, index: 0, matched: false, errors: 0, early: 0, statuses: [] as string[] })
  const time = (now: number) => clock.current.tick + (clock.current.running && mode === 'rhythm' ? (now - clock.current.started) * rate : 0)
  const publish = (tick: number) => {
    const e = engine.current!
    if (e.complete) clock.current.running = false
    setView({ tick: mode === 'reading' ? e.timeline.targets[e.index]?.start ?? 0 : Math.min(tick, e.timeline.end),
      running: clock.current.running, complete: e.complete, index: e.index, matched: e.matched,
      errors: e.errors, early: e.earlyReleases.length, statuses: e.results.map(result => result.status) })
  }
  useEffect(() => {
    if (!mode) return
    inputRef.current = {
      input(note, now) {
        const e = engine.current
        if (!e) return
        if (clock.current.running) {
          const tick = time(now)
          e.input(note.key, note.pitch, note.down, tick)
          publish(tick)
        } else if (!note.down) e.held.delete(note.key)
      },
      release(source) { engine.current?.releaseSource(source) },
      pause() {
        if (!clock.current.running) return
        const tick = time(performance.now())
        clock.current = { tick, started: 0, running: false }
        engine.current!.advance(tick)
        engine.current!.cancelAttempt()
        publish(tick)
      },
    }
    return () => { inputRef.current = null }
  })
  useEffect(() => {
    if (!view.running || mode !== 'rhythm') return
    let frame: number
    const update = (now: number) => {
      if (!clock.current.running) return
      const tick = time(now)
      engine.current!.advance(tick)
      publish(tick)
      if (clock.current.running) frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
    // Clock rate stays fixed for this mounted score.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.running, mode])
  const reset = () => {
    if (!mode) return
    engine.current = new PracticeEngine(score, mode)
    clock.current = { tick: initialTick, started: 0, running: false }
    publish(initialTick)
  }
  const start = () => {
    if (!engine.current || engine.current.complete) reset()
    clock.current.started = performance.now()
    clock.current.running = true
    publish(clock.current.tick)
  }
  return { view, start, reset, pause: () => inputRef.current?.pause() }
}
