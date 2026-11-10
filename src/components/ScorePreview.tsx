import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { ArrowLeft, Headphones, Pause, Play, RotateCcw } from 'lucide-react'
import { useScorePractice, type ScoreMode, type ScorePracticeInput } from './useScorePractice'
import { playScore } from '../music/audition'
import { notation } from '../music/notation'
import { practiceAnchor } from '../music/spacing'
import { onsetWindow, practiceTimeline } from '../music/practiceEngine'
import type { MidiNote } from '../midi'
import { noteName } from '../practice'
export type { ScorePracticeInput } from './useScorePractice'
import { scoreExamples } from '../music/examples'
import { cursorX, drawScore, type PreviewLayout } from '../music/engraving'
import { measureTicks, TICKS_PER_QUARTER, type Score } from '../music/score'

type InputProps = { inputRef: RefObject<ScorePracticeInput | null>; held: Record<string, number>; onInput: (note: MidiNote) => void }

function PreviewSheet({ score, labels, mode, inputRef, held, onInput, metadata, instruction }: InputProps & { score: Score; labels: boolean; mode: ScoreMode | null; metadata: ReactNode; instruction?: string }) {
  const viewport = useRef<HTMLDivElement>(null)
  const paper = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<PreviewLayout>({ width: 0, height: 0, positions: [] })
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [audible, setAudible] = useState(false)
  const [audioError, setAudioError] = useState('')
  const audio = useRef<AudioContext | null>(null)
  useEffect(() => () => { if (audio.current) void audio.current.close(); audio.current = null }, [])
  const audition = () => {
    if (playing && audible) { setPlaying(false); return }
    try {
      const context = audio.current ??= new AudioContext()
      void context.resume().catch(() => { if (audio.current === context) { setAudioError('暂时无法播放声音'); setPlaying(false) } })
      setAudioError('')
      if (tick >= end) setTick(0)
      setAudible(true)
      setPlaying(true)
    } catch { setAudioError('当前浏览器无法播放试听') }
  }
  const practice = useScorePractice(score, mode, inputRef, setPlaying)
  const { view } = practice
  const timeline = useMemo(() => mode ? practiceTimeline(score) : null, [mode, score])
  const pitches = useMemo(() => [...new Set(timeline?.targets.flatMap(target => [...target.pitches.keys()]))].sort((a, b) => a - b), [timeline])
  const [touch, setTouch] = useState(false)
  const displayTick = mode === 'reading' ? timeline?.targets[view.index]?.start ?? 0 : mode ? Math.max(0, view.tick) : tick
  const end = score.measures * measureTicks(score.meter)
  useEffect(() => {
    let active = true
    const render = async () => {
      await document.fonts.ready
      if (!active || !paper.current || !viewport.current) return
      try { setLayout(drawScore(paper.current, score, labels, viewport.current.clientHeight - 8, viewport.current.clientWidth, mode === 'rhythm')); setError('') }
      catch (e) { setError(e instanceof Error ? e.message : '谱面暂时无法显示') }
    }
    const observer = new ResizeObserver(() => { void render() })
    observer.observe(viewport.current!)
    return () => { active = false; observer.disconnect() }
  }, [score, labels, mode])
  useEffect(() => {
    if (!playing) return
    let frame = 0
    const start = performance.now(), initial = tick
    const context = audible ? audio.current : null
    const performanceAudio = context ? playScore(context, score, initial) : null
    const update = (now: number) => {
      const elapsed = context && performanceAudio ? Math.max(0, context.currentTime - performanceAudio.start) * 1000 : now - start
      const next = Math.min(end, initial + elapsed * score.tempo.quarterBpm * TICKS_PER_QUARTER / 60_000)
      setTick(next)
      if (next >= end) setPlaying(false)
      else frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    const pause = () => setPlaying(false)
    const hidden = () => { if (document.hidden) pause() }
    const portrait = matchMedia('(orientation: portrait)')
    const rotated = () => { if (portrait.matches) pause() }
    window.addEventListener('blur', pause); document.addEventListener('visibilitychange', hidden); portrait.addEventListener('change', rotated)
    return () => { performanceAudio?.stop(); cancelAnimationFrame(frame); window.removeEventListener('blur', pause); document.removeEventListener('visibilitychange', hidden); portrait.removeEventListener('change', rotated) }
    // tick is captured on each explicit start, not on every animation frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, audible, score, end])
  const following = mode !== null
  const fixedAnchor = `max(${practiceAnchor.min}px, ${practiceAnchor.ratio * 100}%)`
  const quarterWidth = cursorX(layout.positions, TICKS_PER_QUARTER) - cursorX(layout.positions, 0)
  const leadInOffset = mode === 'rhythm' ? Math.min(0, view.tick) * quarterWidth / TICKS_PER_QUARTER : 0
  const axisX = cursorX(layout.positions, displayTick) + leadInOffset
  const firstX = cursorX(layout.positions, 0)
  useEffect(() => {
    paper.current?.querySelectorAll<SVGElement>('[data-event-id]').forEach(element => {
      const start = Number(element.dataset.tick), end = start + Number(element.dataset.durationTicks)
      const i = element.dataset.kind === 'rest' ? -1 : timeline?.targets.findIndex(target => target.start === start) ?? -1
      const status = view.statuses[i]
      const active = mode === 'reading' ? i === view.index && !view.complete : view.tick >= start && view.tick < end
      element.classList.toggle('preview-current', mode ? active && (status === 'pending' || (mode === 'reading' && status === undefined)) : tick >= start && tick < end)
      element.classList.toggle('preview-passed', mode ? status === 'hit' : tick >= end)
      element.classList.toggle('preview-missed', mode !== null && status === 'miss')
    })
  }, [tick, layout, timeline, mode, view])
  const seekScroll = (element: HTMLDivElement, x: number) => {
    const anchor = Math.max(practiceAnchor.min, element.clientWidth * practiceAnchor.ratio)
    element.scrollLeft = Math.max(0, x - Math.min(firstX, anchor))
  }
  useEffect(() => {
    if (following || (!playing && tick !== 0) || !viewport.current) return
    seekScroll(viewport.current, axisX)
  // The starting geometry changes when the score is resized.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axisX, playing, following, firstX, tick, layout])
  const markerTick = mode === 'reading' ? displayTick
    : timeline?.targets.find(target => Math.abs(target.start - view.tick) <= onsetWindow)?.start
  const markerAnchor = markerTick === undefined ? 0 : cursorX(layout.positions, markerTick)
  const targetHeads = markerTick === undefined ? undefined : layout.heads?.get(markerTick)
  const firstHead = targetHeads?.values().next().value
  const markerX = firstHead ? 12 + firstHead.x - markerAnchor : 12
  const heldMarkers = mode ? [...new Set(Object.values(held))].flatMap(pitch => {
    const head = targetHeads?.get(pitch)
    if (head) return [{ pitch, x: 12 + head.x - markerAnchor, y: head.y, rx: head.rx, ry: head.ry, tilt: head.tilt }]
    const guides = layout.pitchGuides ?? []
    const guide = guides.find(item => item.clef === (pitch < 60 ? 'bass' : 'treble')) ?? guides[0]
    if (!guide) return []
    const steps = (Math.floor(pitch / 12) - 5) * 7 + [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][pitch % 12]
    const y = guide.middleC - steps * guide.gap / 2
    const radius = guide.gap * notation.head / 14
    return y >= 6 && y <= layout.height - 6 ? [{ pitch, x: markerX, y, rx: radius, ry: radius * notation.ratio, tilt: notation.tilt }] : []
  }) : []
  const restart = () => { setTick(0); setPlaying(false); if (viewport.current) seekScroll(viewport.current, firstX) }
  const status = view.complete ? '本轮完成' : !view.running && Object.keys(held).length ? '请先松开琴键' : view.matched ? '音已弹对，请松键' : mode === 'rhythm' && view.tick < 0 ? '空白小节 · 等待第一拍' : mode === 'reading' ? `第 ${view.index + 1} / ${timeline?.targets.length} 组` : '跟随游标弹奏'
  return <>
    <section className="score-surface" aria-label="谱例显示">
    {metadata}
    <div className="preview-frame">
    <div className={`preview-viewport${following ? ' preview-following' : ''}`} ref={viewport} tabIndex={following ? undefined : 0} aria-label={mode === 'reading' ? '识谱练习谱面' : following ? '节拍跟弹谱面' : '横向浏览谱面'}>
      <div className={mode === 'reading' ? 'preview-strip reading-note-track' : 'preview-strip'} style={{ width: layout.width || undefined, height: layout.height || undefined, left: following ? fixedAnchor : undefined, marginLeft: !following ? `max(0px, calc(${fixedAnchor} - ${firstX}px))` : undefined, transform: following ? `translateX(${-axisX}px)` : undefined }}>
        <div className="preview-paper" ref={paper} />
        {!following && !playing && layout.positions.length > 0 && <div className="preview-cursor" style={{ left: axisX, height: layout.height }} aria-hidden="true" />}
      </div>
      {!mode && layout.positions.length > 0 && <div className="preview-end-space" aria-hidden="true" />}
      {mode === 'rhythm' && layout.positions.length > 0 && <svg className="preview-fixed-axis" style={{ left: fixedAnchor }} width={Math.max(2, quarterWidth * 2 * onsetWindow / TICKS_PER_QUARTER)} height={layout.height} aria-hidden="true">
        <rect width="100%" y="6" height={Math.max(0, layout.height - 12)} className="timing-band" />
        <line x1="50%" x2="50%" y1="6" y2={Math.max(6, layout.height - 6)} className="play-axis" />
      </svg>}
      {mode === 'reading' && !view.complete && layout.positions.length > 0 && <span className="preview-reading-anchor" style={{ left: fixedAnchor, top: Math.max(0, layout.height - 12) }} aria-hidden="true" />}
      {following && heldMarkers.length > 0 && <svg className="preview-input-marks" style={{ left: fixedAnchor }} width="24" height={layout.height} aria-hidden="true">{heldMarkers.map(({ pitch, x, y, rx, ry, tilt }) => <ellipse key={pitch} data-held-pitch={pitch} className="played-note" cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${tilt} ${x} ${y})`} />)}</svg>}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
    {!following && playing && layout.positions.length > 0 && <div className="preview-cursor preview-playing-cursor" style={{ left: fixedAnchor, height: layout.height }} aria-hidden="true" />}
    </div>
    <div className="score-feedback score-feedback-slot" aria-live="polite">{audioError ? <span role="alert">{audioError}</span> : mode && (view.running || view.complete || Object.keys(held).length || (mode === 'rhythm' && view.tick < 0)) ? status : instruction ?? (mode ? status : null)}</div>
    </section>
    {mode && touch && <div className="touch-keyboard score-touch" aria-label="谱例触控键盘">{pitches.map(pitch => {
      const send = (pointer: number, down: boolean) => onInput({ pitch, down, key: `touch:${pointer}` })
      return <button key={pitch} className={`touch-key ${Object.values(held).includes(pitch) ? 'pressed' : ''}`} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); send(event.pointerId, true) }} onPointerUp={event => send(event.pointerId, false)} onPointerCancel={event => send(event.pointerId, false)} onLostPointerCapture={event => send(event.pointerId, false)}>{noteName(pitch)}</button>
    })}</div>}
    {mode ? <footer className="transport">
      <div className="practice-progress" aria-live="polite">
        <div className="progress-summary">{view.complete ? '本轮完成' : mode === 'reading' ? `第 ${view.index + 1} / ${timeline?.targets.length} 组` : `第 ${Math.min(score.measures, Math.floor(displayTick / measureTicks(score.meter)) + 1)} / ${score.measures} 小节`}</div>
        <progress className="score-progress-meter" aria-label="本轮进度" max={1} value={view.complete ? 1 : mode === 'reading' ? view.index / (timeline?.targets.length || 1) : displayTick / end} />
        <small>{view.statuses.filter(status => status === 'hit').length} 命中 · {view.errors} 错弹{mode === 'rhythm' && ` · ${view.statuses.filter(status => status === 'miss').length} 漏弹 · ${view.early} 提前松键`}</small>
      </div>
      <div className="transport-actions">
      <button className="icon-button" aria-label="重练谱例" onClick={() => { practice.reset(); viewport.current?.scrollTo({ left: 0 }) }}><RotateCcw /></button>
      <button className="button primary" disabled={!!error || !layout.positions.length || (!view.running && !!Object.keys(held).length)} onClick={() => view.running ? practice.pause() : view.complete ? practice.reset() : practice.start()}>{view.running ? <Pause /> : <Play />}{view.running ? '暂停' : view.complete ? '再练一次' : '开始 / 继续'}</button>
      </div><div className="transport-right"><button className="button quiet" aria-pressed={touch} disabled={!pitches.length} onClick={() => { if (touch) { practice.pause(); Object.entries(held).forEach(([key, pitch]) => { if (key.startsWith('touch:')) onInput({ key, pitch, down: false }) }) }; setTouch(!touch) }}>触控试弹</button></div>
    </footer> : <footer className="transport">
      <div className="practice-progress">
      <span>第 {Math.min(score.measures, Math.floor(tick / measureTicks(score.meter)) + 1)} / {score.measures} 小节</span>
      <input aria-label="谱面位置" type="range" min="0" max={end} step="0.1" value={tick} onChange={event => { setPlaying(false); const next = Number(event.target.value); setTick(next); if (viewport.current) seekScroll(viewport.current, cursorX(layout.positions, next)) }} />
      </div><div className="transport-actions"><button className="icon-button" aria-label="回到谱例开头" onClick={restart}><RotateCcw /></button>
      <button className="button primary" disabled={!!error || !layout.positions.length} onClick={() => { if (tick >= end) setTick(0); setAudible(false); setPlaying(!playing || audible) }}>{playing && !audible ? <Pause /> : <Play />}{playing && !audible ? '暂停游标' : '播放游标'}</button>
      </div><div className="transport-right"><button className="button audition-action" disabled={!!error || !layout.positions.length} onClick={audition}>{playing && audible ? <Pause /> : <Headphones />}{playing && audible ? '暂停试听' : '试听'}</button></div>
    </footer>}
  </>
}
export default function ScorePreview({ onBack, inputRef, held, onInput, initialScore, initialMode = null, labels, onToggleLabels, title = '谱例预览', instruction }: InputProps & { onBack: () => void; initialScore?: Score; initialMode?: ScoreMode | null; title?: string; instruction?: string; labels: boolean; onToggleLabels: () => void }) {
  const [mode, setMode] = useState<ScoreMode | null>(initialMode)
  const [selected, setSelected] = useState(0)
  const [voice, setVoice] = useState(-1)
  const source = initialScore ?? scoreExamples[selected]
  const score = useMemo(() => voice >= 0 && source.voices[voice] ? { ...source, voices: [source.voices[voice]] } : source, [source, voice])
  return <main className="practice-page preview-page">
    <div className="practice-heading"><div><button className="icon-button" aria-label="返回主页" onClick={onBack}><ArrowLeft /></button><h1>{title}</h1></div><div className="preview-heading-controls"><select disabled={!!mode} aria-label="显示声部" value={voice} onChange={event => setVoice(Number(event.target.value))}><option value="-1">全部声部</option>{source.voices.map((item, i) => <option key={item.id} value={i}>声部 {i + 1} · {item.clef === 'treble' ? '高音' : '低音'}</option>)}</select></div></div>
    <PreviewSheet key={`${selected}:${voice}:${mode}`} score={score} labels={labels} mode={mode} inputRef={inputRef} held={held} onInput={onInput} instruction={instruction} metadata={<div className="score-meta preview-selector">{initialScore ? <strong>{source.title}</strong> : <label>验证谱例<select disabled={!!mode} value={selected} onChange={event => { setSelected(Number(event.target.value)); setVoice(-1) }}>{scoreExamples.map((example, i) => <option key={example.title} value={i}>{example.title}</option>)}</select></label>}<span>{score.voices.length} 声部 · {score.meter.numerator}/{score.meter.denominator} · ♩ = {score.tempo.quarterBpm}</span><div className="score-mode-buttons">{mode ? <button className="button quiet" onClick={() => setMode(null)}>返回预览</button> : <><button className="button quiet" disabled={!score.voices.some(voice => voice.events.some(event => event.kind === 'notes'))} onClick={() => setMode('reading')}>练习识谱</button><button className="button quiet" onClick={() => setMode('rhythm')}>练习跟弹</button></>}</div><label className="note-name-toggle"><input type="checkbox" checked={labels} onChange={onToggleLabels} /><span>音名</span></label></div>} />
  </main>
}
