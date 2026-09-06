import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { midiNumberToPianoNote } from '../data/piano'
import { measureBeats, parseScore, scoreLength } from '../score/scoreModel'
import ScoreStaff from '../score/ScoreStaff'
import PracticeTransport from './PracticeTransport'
import { ScorePractice } from './scorePractice'
import './trainer.css'

interface Props { controller: ScorePractice; active: boolean; inputHeld: boolean; onPlayNote: (pitch: number) => void; onStopNote: (pitch: number) => void }
const noEnd = () => {}
export default function ScoreTrainer({ controller, active, inputHeld, onPlayNote, onStopNote }: Props) {
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)
  const [notice, setNotice] = useState('')
  const [playback, setPlayback] = useState({ beat: 0, playing: false })
  const { score, from, to } = state
  const beats = measureBeats(score.timeSignature)
  const measures = Math.max(1, Math.ceil(scoreLength(score) / beats))
  const targets = controller.targets()
  const target = targets[state.index]
  const rangeStart = (from - 1) * beats
  const demo = useMemo(() => ({ ...score, events: score.events.filter(e => e.startBeat < to * beats && e.startBeat + e.duration > rangeStart).map(e => ({ ...e, startBeat: Math.max(e.startBeat, rangeStart) - rangeStart, duration: Math.min(e.startBeat + e.duration, to * beats) - Math.max(e.startBeat, rangeStart) })) }), [score, to, beats, rangeStart])
  const reportPlayback = useCallback((beat: number, playing: boolean) => setPlayback(current => current.beat === beat && current.playing === playing ? current : { beat, playing }), [])
  useEffect(() => {
    if (!active) controller.pause()
    const pauseHidden = () => { if (document.hidden) controller.pause() }
    document.addEventListener('visibilitychange', pauseHidden)
    return () => { document.removeEventListener('visibilitychange', pauseHidden); controller.pause() }
  }, [active, controller])
  useEffect(() => {
    if (!state.running) return
    const timer = window.setInterval(controller.tick, 1000)
    return () => window.clearInterval(timer)
  }, [controller, state.running])
  function loadSaved() {
    try {
      const saved = localStorage.getItem('music-notation-studio.score.v1') ?? localStorage.getItem('piano-trainer.score.v1')
      if (!saved) { setNotice('还没有保存的乐谱。请先在 Editor 保存，或点击「去练习」。'); return }
      controller.load(parseScore(saved)); setNotice('')
    } catch { setNotice('无法读取本地乐谱，请在 Editor 检查或重新保存。') }
  }
  function select(id: string) {
    if (inputHeld || playback.playing) return
    const index = targets.findIndex(e => e.id === id)
    if (index >= 0) { controller.reset(index); setNotice('') }
    else setNotice('请选择练习范围内的音符；休止符无需单独练习。')
  }
  return <section hidden={!active} className="score-editor score-trainer" aria-label="乐谱跟练">
    <div className="score-document-bar">
      <strong className="trainer-title" title={score.title}>{score.title}</strong>
      <span className="score-summary">练习副本 · {score.timeSignature.join('/')} · {score.events.length} 项</span>
      <div className="score-actions score-document-actions"><button disabled={inputHeld || state.running || playback.playing} onClick={loadSaved}>载入已保存乐谱</button></div>
    </div>
    <div className="score-entry trainer-entry">
      <div className="trainer-mode"><strong>跟谱练习</strong><span>自由速度 · 音高匹配</span></div>
      <label>起始小节<input aria-label="起始小节" type="number" min="1" max={to} key={`from-${from}-${to}`} defaultValue={from} disabled={inputHeld || playback.playing} onBlur={e => { controller.configure(Number(e.target.value), to, state.loop); e.target.value = String(controller.getSnapshot().from) }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} /></label>
      <label>结束小节<input aria-label="结束小节" type="number" min={from} max={measures} key={`to-${to}-${from}`} defaultValue={to} disabled={inputHeld || playback.playing} onBlur={e => { controller.configure(from, Number(e.target.value), state.loop); e.target.value = String(controller.getSnapshot().to) }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} /></label>
      <button disabled={inputHeld || playback.playing} onClick={() => controller.configure(1, measures, state.loop)}>整曲</button>
      <button aria-pressed={state.loop} disabled={inputHeld || playback.playing} onClick={() => controller.configure(from, to, !state.loop)}>循环 {state.loop ? '开' : '关'}</button>
      <div className="trainer-session-actions"><button className="score-primary" disabled={!targets.length || inputHeld || playback.playing} onClick={() => { setNotice(''); if (state.running) controller.pause(); else controller.start() }}>{state.running ? '暂停练习' : '开始练习'}</button><button disabled={inputHeld || playback.playing || !targets.length} onClick={() => { setNotice(''); controller.reset() }}>重新开始</button></div>
    </div>
    {score.events.length ? <ScoreStaff readOnly score={score} selected={target?.id ?? null} beat={rangeStart + playback.beat} playing={playback.playing} previewPitches={[]} previewDuration={1} insertionIndex={target ? score.events.indexOf(target) : 0} onSelect={select} onEnd={noEnd} /> : <div className="trainer-empty"><strong>把自己的乐谱变成练习</strong><p>在 Editor 编写旋律或和弦后点击「去练习」，也可以载入此前保存的乐谱。</p><p>先听示范，再按自己的速度逐项练习。</p></div>}
    <PracticeTransport key={`${score.title}-${score.tempo}-${from}-${to}`} document={demo} phrase={null} enabled={active && !state.running} currentTargetIndex={demo.events.findIndex(e => e.id === target?.id)} onPlayNote={onPlayNote} onStopNote={onStopNote} onPlaybackChange={reportPlayback} onBeforePlay={controller.pause} />
    <div className="trainer-metrics"><span>当前目标 <strong>{target?.pitches.map(p => midiNumberToPianoNote(p)?.name).join(' · ') || '—'}</strong></span><span>完成 <strong>{state.completed} / {targets.length - state.runStart}</strong></span><span>首次正确 <strong>{state.completed ? Math.round(state.firstTry / state.completed * 100) : 0}%</strong></span><span>错误 <strong>{state.errors}</strong></span><span>用时 <strong>{state.seconds} 秒</strong></span><span>已完成轮次 <strong>{state.rounds}</strong></span></div>
    <p className="score-message" role="status">{notice || state.message}</p>
    {state.result && <p className="trainer-result">上一轮：{state.result}</p>}
    <p className="score-hint">和弦需同时按对所有音，全部松键后继续。点击范围内音符可从该项重新计分。跨小节延音作为一个目标；范围起点处的延音也会包含。BPM 仅影响示范播放。</p>
  </section>
}
