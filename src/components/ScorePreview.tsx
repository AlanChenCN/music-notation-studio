import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { ArrowLeft, Pause, Play, RotateCcw } from 'lucide-react'
import { useScorePractice, type ScoreMode, type ScorePracticeInput } from './useScorePractice'
import { practiceAnchor } from '../music/spacing'
import { onsetWindow, practiceTimeline } from '../music/practiceEngine'
import type { MidiNote } from '../midi'
import { noteName } from '../practice'
export type { ScorePracticeInput } from './useScorePractice'
import { scoreExamples } from '../music/examples'
import { cursorX, drawScore, type PreviewLayout } from '../music/engraving'
import { measureTicks, TICKS_PER_QUARTER, type Score } from '../music/score'

type InputProps = { inputRef: RefObject<ScorePracticeInput | null>; held: Record<string, number>; onInput: (note: MidiNote) => void }

function PreviewSheet({ score, labels, mode, inputRef, held, onInput }: InputProps & { score: Score; labels: boolean; mode: ScoreMode | null }) {
  const viewport = useRef<HTMLDivElement>(null)
  const paper = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<PreviewLayout>({ width: 0, height: 0, positions: [] })
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)
  const [playing, setPlaying] = useState(false)
  const practice = useScorePractice(score, mode, inputRef)
  const { view } = practice
  const timeline = useMemo(() => mode ? practiceTimeline(score) : null, [mode, score])
  const pitches = useMemo(() => [...new Set(timeline?.targets.flatMap(target => [...target.pitches.keys()]))].sort((a, b) => a - b), [timeline])
  const [touch, setTouch] = useState(false)
  const displayTick = mode ? Math.max(0, view.tick) : tick
  const end = score.measures * measureTicks(score.meter)
  useEffect(() => {
    let active = true
    const render = async () => {
      await document.fonts.ready
      if (!active || !paper.current || !viewport.current) return
      try { setLayout(drawScore(paper.current, score, labels, viewport.current.clientHeight - 8, viewport.current.clientWidth)); setError('') }
      catch (e) { setError(e instanceof Error ? e.message : '谱面暂时无法显示') }
    }
    const observer = new ResizeObserver(() => { void render() })
    observer.observe(viewport.current!)
    return () => { active = false; observer.disconnect() }
  }, [score, labels])
  useEffect(() => {
    if (!playing) return
    let frame = 0
    const start = performance.now(), initial = tick
    const update = (now: number) => {
      const next = Math.min(end, initial + (now - start) * score.tempo.quarterBpm * TICKS_PER_QUARTER / 60_000)
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
    return () => { cancelAnimationFrame(frame); window.removeEventListener('blur', pause); document.removeEventListener('visibilitychange', hidden); portrait.removeEventListener('change', rotated) }
    // tick is captured on each explicit start, not on every animation frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, score, end])
  const following = mode === 'rhythm'
  const fixedAnchor = `max(${practiceAnchor.min}px, ${practiceAnchor.ratio * 100}%)`
  const quarterWidth = cursorX(layout.positions, TICKS_PER_QUARTER) - cursorX(layout.positions, 0)
  const axisX = cursorX(layout.positions, displayTick) + (following ? Math.max(-1, Math.min(0, view.tick / TICKS_PER_QUARTER)) * quarterWidth : 0)
  useEffect(() => {
    paper.current?.querySelectorAll<SVGElement>('[data-event-id]').forEach(element => {
      const start = Number(element.dataset.tick), end = start + Number(element.dataset.durationTicks)
      const i = element.dataset.kind === 'rest' ? -1 : timeline?.targets.findIndex(target => target.start === start) ?? -1
      const status = view.statuses[i]
      const active = mode === 'reading' ? i === view.index && !view.complete : view.tick >= start && view.tick < end
      element.classList.toggle('preview-current', mode ? active && status === 'pending' : tick >= start && tick < end)
      element.classList.toggle('preview-passed', mode ? status === 'hit' : tick >= end)
      element.classList.toggle('preview-missed', mode !== null && status === 'miss')
    })
  }, [tick, layout, timeline, mode, view])
  useEffect(() => {
    if (following || (!playing && !mode) || !viewport.current) return
    const element = viewport.current
    if (axisX > element.scrollLeft + element.clientWidth * .8 || axisX < element.scrollLeft) element.scrollLeft = Math.max(0, axisX - element.clientWidth * .25)
  }, [axisX, playing, mode, following])
  const heldMarkers = mode ? [...new Set(Object.values(held))].flatMap(pitch => {
    const guides = layout.pitchGuides ?? []
    const guide = guides.find(item => item.clef === (pitch < 60 ? 'bass' : 'treble')) ?? guides[0]
    if (!guide) return []
    const steps = (Math.floor(pitch / 12) - 5) * 7 + [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][pitch % 12]
    const y = guide.middleC - steps * guide.gap / 2
    return y >= 6 && y <= layout.height - 6 ? [{ pitch, y, radius: guide.gap * .65 }] : []
  }) : []
  const restart = () => { setTick(0); setPlaying(false); viewport.current?.scrollTo({ left: 0 }) }
  return <>
    <div className={`preview-viewport${following ? ' preview-following' : ''}`} ref={viewport} tabIndex={following ? undefined : 0} aria-label={following ? '节拍跟弹谱面' : '横向浏览谱面'}>
      <div className="preview-strip" style={{ width: layout.width || undefined, height: layout.height || undefined, left: following ? fixedAnchor : undefined, transform: following ? `translateX(${-axisX}px)` : undefined }}>
        <div className="preview-paper" ref={paper} />
        {!following && heldMarkers.length > 0 && <svg className="preview-input-marks" style={{ left: axisX }} width="24" height={layout.height} aria-hidden="true">{heldMarkers.map(({ pitch, y, radius }) => <ellipse key={pitch} data-held-pitch={pitch} className="played-note" cx="12" cy={y} rx={radius} ry={radius * .65} />)}</svg>}
        {!following && layout.positions.length > 0 && <div className="preview-cursor" style={{ left: axisX, height: layout.height }} aria-hidden="true" />}
      </div>
      {following && layout.positions.length > 0 && <svg className="preview-fixed-axis" style={{ left: fixedAnchor }} width={Math.max(2, quarterWidth * 2 * onsetWindow / TICKS_PER_QUARTER)} height={layout.height} aria-hidden="true">
        <rect width="100%" y="6" height={Math.max(0, layout.height - 12)} className="timing-band" />
        <line x1="50%" x2="50%" y1="6" y2={Math.max(6, layout.height - 6)} className="play-axis" />
      </svg>}
      {following && heldMarkers.length > 0 && <svg className="preview-input-marks" style={{ left: fixedAnchor }} width="24" height={layout.height} aria-hidden="true">{heldMarkers.map(({ pitch, y, radius }) => <ellipse key={pitch} data-held-pitch={pitch} className="played-note" cx="12" cy={y} rx={radius} ry={radius * .65} />)}</svg>}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
    {mode && touch && <div className="touch-keyboard score-touch" aria-label="谱例触控键盘">{pitches.map(pitch => {
      const send = (pointer: number, down: boolean) => onInput({ pitch, down, key: `touch:${pointer}` })
      return <button key={pitch} className={`touch-key ${Object.values(held).includes(pitch) ? 'pressed' : ''}`} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); send(event.pointerId, true) }} onPointerUp={event => send(event.pointerId, false)} onPointerCancel={event => send(event.pointerId, false)} onLostPointerCapture={event => send(event.pointerId, false)}>{noteName(pitch)}</button>
    })}</div>}
    {mode ? <footer className="preview-transport score-practice-transport">
      <div className="score-practice-result" aria-live="polite">
        <strong>{view.complete ? '本轮完成' : !view.running && Object.keys(held).length ? '请先松开琴键' : view.matched ? '音已弹对，请松键' : mode === 'rhythm' && view.running && view.tick < 0 ? `四拍预备 · ${5 - Math.ceil(-view.tick / TICKS_PER_QUARTER)}` : mode === 'reading' ? `第 ${view.index + 1} / ${timeline?.targets.length} 组` : '跟随游标弹奏'}</strong>
        <small>{view.statuses.filter(status => status === 'hit').length} 命中 · {view.errors} 错弹{mode === 'rhythm' && ` · ${view.statuses.filter(status => status === 'miss').length} 漏弹 · ${view.early} 提前松键`}</small>
      </div>
      <button className="button quiet" aria-pressed={touch} disabled={!pitches.length} onClick={() => { if (touch) { practice.pause(); Object.entries(held).forEach(([key, pitch]) => { if (key.startsWith('touch:')) onInput({ key, pitch, down: false }) }) }; setTouch(!touch) }}>触控试弹</button>
      <button className="icon-button" aria-label="重练谱例" onClick={() => { practice.reset(); viewport.current?.scrollTo({ left: 0 }) }}><RotateCcw /></button>
      <button className="button primary" disabled={!!error || !layout.positions.length || (!view.running && !!Object.keys(held).length)} onClick={() => view.running ? practice.pause() : practice.start()}>{view.running ? <Pause /> : <Play />}{view.running ? '暂停' : view.complete ? '再练一次' : '开始 / 继续'}</button>
    </footer> : <footer className="preview-transport">
      <span>第 {Math.min(score.measures, Math.floor(tick / measureTicks(score.meter)) + 1)} / {score.measures} 小节</span>
      <input aria-label="谱面位置" type="range" min="0" max={end} step="0.1" value={tick} onChange={event => { setPlaying(false); const next = Number(event.target.value); setTick(next); viewport.current?.scrollTo({ left: Math.max(0, cursorX(layout.positions, next) - viewport.current.clientWidth * .3) }) }} />
      <button className="icon-button" aria-label="回到谱例开头" onClick={restart}><RotateCcw /></button>
      <button className="button primary" disabled={!!error || !layout.positions.length} onClick={() => { if (tick >= end) setTick(0); setPlaying(!playing) }}>{playing ? <Pause /> : <Play />}{playing ? '暂停游标' : '播放游标'}</button>
    </footer>}
  </>
}
export default function ScorePreview({ onBack, inputRef, held, onInput }: InputProps & { onBack: () => void }) {
  const [mode, setMode] = useState<ScoreMode | null>(null)
  const [selected, setSelected] = useState(0)
  const [labels, setLabels] = useState(false)
  const [voice, setVoice] = useState(-1)
  const source = scoreExamples[selected]
  const score = useMemo(() => voice >= 0 && source.voices[voice] ? { ...source, voices: [source.voices[voice]] } : source, [source, voice])
  return <main className="practice-page preview-page">
    <div className="practice-heading"><div><button className="icon-button" aria-label="返回主页" onClick={onBack}><ArrowLeft /></button><h1>谱例预览</h1></div><div className="preview-heading-controls"><select disabled={!!mode} aria-label="显示声部" value={voice} onChange={event => setVoice(Number(event.target.value))}><option value="-1">全部声部</option>{source.voices.map((item, i) => <option key={item.id} value={i}>声部 {i + 1} · {item.clef === 'treble' ? '高音' : '低音'}</option>)}</select><label className="note-name-toggle"><input type="checkbox" checked={labels} onChange={event => setLabels(event.target.checked)} /><span>音名</span></label></div></div>
    <div className="preview-selector"><label>验证谱例<select disabled={!!mode} value={selected} onChange={event => { setSelected(Number(event.target.value)); setVoice(-1) }}>{scoreExamples.map((example, i) => <option key={example.title} value={i}>{example.title}</option>)}</select></label><span>{score.voices.length} 声部 · {score.meter.numerator}/{score.meter.denominator} · ♩ = {score.tempo.quarterBpm}</span><div className="score-mode-buttons">{mode ? <button className="button quiet" onClick={() => setMode(null)}>返回预览</button> : <><button className="button quiet" disabled={!score.voices.some(voice => voice.events.some(event => event.kind === 'notes'))} onClick={() => setMode('reading')}>练习识谱</button><button className="button quiet" onClick={() => setMode('rhythm')}>练习跟弹</button></>}</div></div>
    <section className="score-surface preview-surface" aria-label="谱例显示"><PreviewSheet key={`${selected}:${voice}:${mode}`} score={score} labels={labels} mode={mode} inputRef={inputRef} held={held} onInput={onInput} /></section>
    <p className="preview-help">{mode ? (mode === 'reading' ? '按组弹对后推进 · 同时出现的音一起弹' : '四拍预备后跟随游标 · 命中与提前松键分别记录') : source.title === '时值与宽度对照' ? '同音对照：全 → 二分 → 四分 → 八分 → 十六分 → 附点 · 横向滑动查看' : '横向滑动查看 · 游标仅作视觉预览，无声音与弹奏判定'}</p>
  </main>
}
