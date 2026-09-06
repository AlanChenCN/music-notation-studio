import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { midiNumberToPianoNote } from '../data/piano'
import { createScore, deleteEvent, durations, insertEvent, parseScore, replaceEvent, scoreLength, timeSignaturePresets, type ScoreDocument } from './scoreModel'
import { ScoreTransport } from './scoreTransport'
import ScoreStaff from './ScoreStaff'
import './score.css'

const storageKey = 'music-notation-studio.score.v1'
const legacyStorageKey = 'piano-trainer.score.v1'
function loadDraft() {
  try {
    const saved = localStorage.getItem(storageKey) ?? localStorage.getItem(legacyStorageKey)
    return { score: saved ? parseScore(saved) : createScore(), message: saved ? '已恢复本地乐谱' : '先试音，再写入。乐谱可单独保存。' }
  } catch { return { score: createScore(), message: '本地乐谱无法读取。原数据未覆盖，可导入备份或手动保存新谱。' } }
}
const names = (pitches: number[]) => pitches.map(pitch => midiNumberToPianoNote(pitch)?.name).join(' · ')
const noteFractions: Record<number, string> = { .25: '1/16', .5: '1/8', 1: '1/4', 2: '1/2', 4: '1' }
const beatFractions: Record<number, string> = { .25: '1/4', .5: '1/2', 1: '1', 2: '2', 4: '4' }
interface Props { onPractice: (score: ScoreDocument) => void; inputHeld: boolean; active: boolean; audition: number[]; onPlayNote: (pitch: number) => void; onStopNote: (pitch: number) => void }
export default function ScoreEditor({ onPractice, inputHeld, active, audition, onPlayNote, onStopNote }: Props) {
  const [initial] = useState(loadDraft)
  const [score, setScore] = useState(initial.score)
  const [saved, setSaved] = useState(JSON.stringify(initial.score))
  const [message, setMessage] = useState(initial.message)
  const [selected, setSelected] = useState<string | null>(null)
  const [duration, setDuration] = useState(1)
  const [undo, setUndo] = useState<ScoreDocument[]>([])
  const [redo, setRedo] = useState<ScoreDocument[]>([])
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const clearAllButton = useRef<HTMLButtonElement>(null)
  const transport = useMemo(() => new ScoreTransport(initial.score, onPlayNote, onStopNote), [initial, onPlayNote, onStopNote])
  const playback = useSyncExternalStore(transport.subscribe, transport.getSnapshot, transport.getSnapshot)
  const length = scoreLength(score)
  const selectedEvent = score.events.find(event => event.id === selected)
  const insertionIndex = selectedEvent ? score.events.indexOf(selectedEvent) : score.events.length
  const editPosition = selectedEvent
    ? `第 ${insertionIndex + 1} 项 · 第 ${selectedEvent.startBeat + 1} 拍`
    : `末尾 · 第 ${length + 1} 拍`
  const dirty = useMemo(() => JSON.stringify(score) !== saved, [score, saved])
  const clearSelection = useCallback(() => setSelected(null), [])

  useEffect(() => {
    if (!active) transport.pause()
    const pauseHidden = () => { if (document.hidden) transport.pause() }
    document.addEventListener('visibilitychange', pauseHidden)
    return () => { document.removeEventListener('visibilitychange', pauseHidden); transport.pause() }
  }, [active, transport])
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  useEffect(() => {
    if (!confirmClearAll) return
    const cancel = (event: Event) => {
      if (!clearAllButton.current?.contains(event.target as Node)) setConfirmClearAll(false)
    }
    document.addEventListener('pointerdown', cancel)
    document.addEventListener('focusin', cancel)
    return () => { document.removeEventListener('pointerdown', cancel); document.removeEventListener('focusin', cancel) }
  }, [confirmClearAll])

  function change(next: ScoreDocument) {
    transport.setScore(next)
    setUndo(current => [...current.slice(-49), score]); setRedo([]); setScore(next)
  }
  function add(pitches: number[]) {
    if (score.events.length >= 2000) { setMessage('当前乐谱已达 2000 个事件，请新建另一份乐谱。'); return }
    if (pitches.length > 12) { setMessage('每个和弦最多 12 个音，请重新试弹。'); return }
    change(insertEvent(score, insertionIndex, pitches, duration))
    setMessage(`已写入${pitches.length ? names(pitches) : '休止符'}，${duration} 拍`)
  }
  function save() {
    try { const text = JSON.stringify(score); localStorage.setItem(storageKey, text); setSaved(text); setMessage('已保存到此浏览器。可导出文件备份。') }
    catch { setMessage('本地保存失败，可能存储空间不足。请导出文件备份。') }
  }
  function exportScore() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(score, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a'); anchor.href = url
    anchor.download = `${score.title.replace(/[<>:"/\\|?*]/g, '_') || 'score'}.notation.json`
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('已请求下载乐谱文件，请查看浏览器下载列表。')
  }
  async function importScore(file: File) {
    try {
      if (file.size > 2_000_000) throw new Error('文件过大，请使用小于 2 MB 的乐谱。')
      const next = parseScore(await file.text())
      if (!window.confirm('打开这份乐谱并替换当前编辑内容？原内容可通过撤销恢复。')) return
      change(next); setSelected(null); transport.stop(); setMessage('已打开文件，请保存到本地或继续编辑。')
    } catch (error) { setMessage(error instanceof Error ? error.message : '无法打开乐谱。') }
  }
  function restore(direction: 'undo' | 'redo') {
    const stack = direction === 'undo' ? undo : redo
    const next = stack.at(-1)
    if (!next) return
    if (direction === 'undo') { setUndo(stack.slice(0, -1)); setRedo(current => [...current, score]) }
    else { setRedo(stack.slice(0, -1)); setUndo(current => [...current, score]) }
    transport.setScore(next); setScore(next); setSelected(null)
  }

  function stepDuration(current: number, direction: -1 | 1) {
    const currentIndex = durations.indexOf(current as (typeof durations)[number])
    return durations[Math.max(0, Math.min(durations.length - 1, currentIndex + direction))]
  }

  function changeEntryDuration(direction: -1 | 1) {
    setDuration(current => stepDuration(current, direction))
  }

  function changeSelectedDuration(direction: -1 | 1) {
    if (!selectedEvent) return
    change(replaceEvent(score, selectedEvent.id, {
      duration: stepDuration(selectedEvent.duration, direction),
    }))
  }

  function deleteSelected() {
    if (!selectedEvent) return
    const nextEvent = score.events[insertionIndex + 1]
    change(deleteEvent(score, selectedEvent.id))
    setSelected(nextEvent?.id ?? null)
  }

  function durationText(value: number) {
    return `${noteFractions[value]} 音符 | ${beatFractions[value]} 拍`
  }

  function goToStart() {
    setSelected(score.events[0]?.id ?? null)
  }

  function clearAll() {
    if (!confirmClearAll) { setConfirmClearAll(true); return }
    change({ ...score, events: [] })
    setSelected(null)
    setConfirmClearAll(false)
    setMessage('已删除全部事件，可通过撤销恢复。')
  }

  function updateTempo(nextTempo: number) {
    const tempo = Math.max(30, Math.min(240, nextTempo))
    if (tempo !== score.tempo) change({ ...score, tempo })
  }

  function stepTimeSignature(direction: -1 | 1) {
    const current = timeSignaturePresets.findIndex(([numerator, denominator]) => numerator === score.timeSignature[0] && denominator === score.timeSignature[1])
    const next = (current + direction + timeSignaturePresets.length) % timeSignaturePresets.length
    const [numerator, denominator] = timeSignaturePresets[next]
    change({ ...score, timeSignature: [numerator, denominator] })
  }

  return <section hidden={!active} id="score-panel" role="tabpanel" aria-labelledby="score-tab" className="score-editor">
    <div className="score-document-bar">
      <label className="score-title-field"><input aria-label="乐谱名称" maxLength={120} value={score.title} onChange={event => change({ ...score, title: event.target.value })} /></label>
      <div className="score-summary"><span>{score.timeSignature[0]}/{score.timeSignature[1]} · 单声部</span><span>{score.events.length} 项 · {length} 拍</span></div>
      <div className="score-actions score-document-actions">
        <button className="score-file-action" onClick={() => { if (dirty && !window.confirm('新建乐谱？未保存内容可通过撤销恢复。')) return; change(createScore()); setSelected(null); transport.stop() }}>新建</button>
        <button className={`score-file-action${dirty ? ' score-primary' : ''}`} onClick={save}>保存</button>
        <button className="score-file-action" disabled={inputHeld || !score.events.some(event => event.pitches.length)} onClick={() => { transport.pause(); onPractice(score) }}>去练习</button>
        <button className="score-file-action" onClick={exportScore}>导出</button>
        <button className="score-file-action" onClick={() => fileInput.current?.click()}>打开文件</button>
        <input ref={fileInput} type="file" accept=".json,application/json" hidden aria-label="导入乐谱文件" onChange={event => { const file = event.target.files?.[0]; if (file) void importScore(file); event.target.value = '' }} />
        <span className="score-action-divider" aria-hidden="true" />
        <button className="score-history-action" disabled={!undo.length} onClick={() => restore('undo')} aria-label="撤销">↶</button>
        <button className="score-history-action" disabled={!redo.length} onClick={() => restore('redo')} aria-label="重做">↷</button>
      </div>
    </div>
    <div className="score-entry" aria-label="乐谱编辑操作">
      <div className="score-entry-inner">
        <div className="score-time-signature" aria-label="拍号">
          <span>拍号</span>
          <div className="score-time-signature-controls"><button aria-label="上一个拍号" onClick={() => stepTimeSignature(-1)}>◀</button><output>{score.timeSignature[0]}/{score.timeSignature[1]}</output><button aria-label="下一个拍号" onClick={() => stepTimeSignature(1)}>▶</button></div>
        </div>
        <div className="score-edit-context" aria-label="编辑位置" aria-live="polite" title={editPosition}>
          <span>编辑</span>
          <strong>
            <span className="score-edit-context-line">
              {selectedEvent ? <><span>第</span><b className="score-edit-context-number">{insertionIndex + 1}</b><span>项</span></> : <span className="score-edit-context-number score-edit-context-number--text">末尾</span>}
            </span>
            <span className="score-edit-context-line"><span>第</span><b className="score-edit-context-number">{selectedEvent ? selectedEvent.startBeat + 1 : length + 1}</b><span>拍</span></span>
          </strong>
        </div>
        <div className="score-edit-matrix">
          <div className="score-edit-row score-edit-row--insert">
            <div className="score-note-value score-note-value--input"><span>输入音</span><strong>{audition.length ? names(audition) : '在底部琴键上试弹'}</strong></div>
            <div className="score-stepper score-stepper--entry" aria-label="输入音时值">
              <span>输入时值</span>
              <div><button aria-label="缩短输入时值" disabled={duration === durations[0]} onClick={() => changeEntryDuration(-1)}>◀</button><output>{durationText(duration)}</output><button aria-label="延长输入时值" disabled={duration === durations.at(-1)} onClick={() => changeEntryDuration(1)}>▶</button></div>
            </div>
          </div>
          <div className="score-edit-row score-edit-row--current">
            <div className="score-note-value score-note-value--current"><span>当前音</span><strong>{selectedEvent ? (selectedEvent.pitches.length ? names(selectedEvent.pitches) : '休止符') : '未选择谱上内容'}</strong></div>
            <div className="score-stepper score-stepper--entry" aria-label="当前音符时值">
              <span>当前时值</span>
              <div><button aria-label="缩短当前时值" disabled={!selectedEvent || selectedEvent.duration === durations[0]} onClick={() => changeSelectedDuration(-1)}>◀</button><output>{selectedEvent ? durationText(selectedEvent.duration) : '—'}</output><button aria-label="延长当前时值" disabled={!selectedEvent || selectedEvent.duration === durations.at(-1)} onClick={() => changeSelectedDuration(1)}>▶</button></div>
            </div>
          </div>
        </div>
        <div className="score-action-matrix" aria-label="乐谱写入与辅助操作">
          <button className="score-action-button score-primary" disabled={!audition.length} onClick={() => add(audition)}>写入音符</button>
          <button className="score-action-button" onClick={() => add([])}>写入休止符</button>
          <button className="score-action-button" disabled={!score.events.length} onClick={goToStart}>回到开头</button>
          <button className="score-action-button" disabled={!selectedEvent} onClick={clearSelection}>回到末尾</button>
          <button className="score-action-button" disabled={!selectedEvent || !audition.length || audition.length > 12} onClick={() => selectedEvent && change(replaceEvent(score, selectedEvent.id, { pitches: audition }))}>替换音符</button>
          <button className="score-action-button" disabled={!selectedEvent} onClick={() => selectedEvent && change(replaceEvent(score, selectedEvent.id, { pitches: [] }))}>替换休止符</button>
          <button ref={clearAllButton} className={`score-action-button${confirmClearAll ? ' score-danger-confirm' : ''}`} disabled={!score.events.length} onClick={clearAll}>{confirmClearAll ? '确认删除' : '删除全部'}</button>
          <button className="score-action-button" disabled={!selectedEvent} onClick={deleteSelected}>删除当前</button>
        </div>
      </div>
    </div>
    <ScoreStaff score={score} selected={selected} beat={playback.beat} playing={playback.playing} previewPitches={audition} previewDuration={duration} insertionIndex={insertionIndex} onSelect={setSelected} onEnd={clearSelection} />
    <div className="score-transport">
      <div className="score-progress-group">
        <label className="score-progress"><input aria-label="播放进度" type="range" min="0" max={length || 1} step="0.01" disabled={!length} value={playback.beat} onChange={event => transport.seek(Number(event.target.value))} /></label>
        <output>{playback.beat.toFixed(1)} / {length} 拍</output>
      </div>
      <span className="score-transport-divider" aria-hidden="true" />
      <div className="score-transport-actions" aria-label="播放控制">
        <button className="score-start-toggle" disabled={!length} onClick={() => transport.seek(0)} aria-label="播放光标回到开头" title="播放光标回到开头">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="2.5" height="14" rx=".6" /><path d="M18 6 9 12l9 6Z" /></svg>
        </button>
        <button className="score-locate-toggle" disabled={!selectedEvent} onClick={() => selectedEvent && transport.seek(selectedEvent.startBeat)} aria-label="定位到当前音符" title="定位到当前音符">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4v16M18 5v10" /><ellipse className="score-locate-notehead" cx="15" cy="15" rx="4" ry="2.8" transform="rotate(-15 15 15)" /></svg>
        </button>
        <button className="score-play-toggle score-primary" disabled={!length} onClick={playback.playing ? transport.pause : transport.play} aria-label={playback.playing ? '暂停播放' : '开始播放'}>
          {playback.playing
            ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="5" width="3.5" height="14" rx="1" /><rect x="13.5" y="5" width="3.5" height="14" rx="1" /></svg>
            : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5 18 12 8 18.5Z" /></svg>}
        </button>
      </div>
      <span className="score-transport-divider" aria-hidden="true" />
      <div className="score-tempo" aria-label="速度 BPM">
        <span>BPM</span>
        <button aria-label="速度降低 10 BPM" disabled={score.tempo <= 30} onClick={() => updateTempo(score.tempo - 10)}>−</button>
        <input aria-label="速度 BPM 数值" type="number" min="30" max="240" key={score.tempo} defaultValue={score.tempo} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur() }} onBlur={event => { const tempo = Number(event.target.value); if (tempo >= 30 && tempo <= 240) updateTempo(tempo); else event.target.value = String(score.tempo) }} />
        <button aria-label="速度提高 10 BPM" disabled={score.tempo >= 240} onClick={() => updateTempo(score.tempo + 10)}>+</button>
      </div>
    </div>
    <p className="score-message" role="status">{message}</p>
  </section>
}
