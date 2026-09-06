import { useState } from 'react'
import { pianoNotes, pianoNoteToMidiNumber } from '../data/piano'
import { durations, timeSignaturePresets, type ScoreDocument } from '../score/scoreModel'
import type { PracticeNoteNameMode } from '../music/noteDisplay'
import ScoreTrainer from './ScoreTrainer'
import type { ScorePractice } from './scorePractice'
import { defaultRandomScoreSettings, generateRandomScore, randomPresets, randomScoreSummary, type RandomScoreSettings } from './randomScore'

interface Props {
  controller: ScorePractice
  active: boolean
  inputHeld: boolean
  onPlayNote: (pitch: number) => void
  onStopNote: (pitch: number) => void
  onSendToEditor: (score: ScoreDocument) => void
}
const durationNames: Record<number, string> = { .25: '十六分', .5: '八分', 1: '四分', 2: '二分', 4: '全音符' }
export default function RandomTrainer({ onSendToEditor, ...practiceProps }: Props) {
  const [draft, setDraft] = useState<RandomScoreSettings>(() => structuredClone(defaultRandomScoreSettings))
  const [applied, setApplied] = useState<RandomScoreSettings | null>(null)
  const [preset, setPreset] = useState('reading')
  const [expanded, setExpanded] = useState(true)
  const [noteNames, setNoteNames] = useState<PracticeNoteNameMode>('hidden')
  const [error, setError] = useState('')
  const [number, setNumber] = useState(0)
  const dirty = JSON.stringify(draft) !== JSON.stringify(applied)
  function patch(updates: Partial<RandomScoreSettings>) { setDraft(current => ({ ...current, ...updates })); setPreset('custom'); setError('') }
  function generate() {
    try {
      const score = generateRandomScore(draft)
      score.title += ` · 第 ${number + 1} 组`
      score.tempo = practiceProps.controller.getSnapshot().tempo
      practiceProps.controller.load(score)
      setApplied(structuredClone(draft)); setNumber(n => n + 1); setError('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : '无法生成题目。') }
  }
  const pitchOptions = pianoNotes.map(note => <option key={note.name} value={pianoNoteToMidiNumber(note)}>{note.name}</option>)
  return <ScoreTrainer {...practiceProps} label="随机练习" noteNameMode={noteNames}
    renderDocumentBar={busy => <div className="score-document-bar random-document-bar">
      <div className="random-document-info"><strong>{number ? `随机${applied?.type === 'chord' ? '和弦' : '单音'} · 第 ${number} 组` : '随机练习'}</strong><span className="score-summary">{applied ? randomScoreSummary(applied) : '选择出题条件，生成一份练习谱'}</span></div>
      <div className="score-actions score-document-actions"><button disabled={busy} className={dirty ? 'score-primary' : ''} onClick={generate}>生成新题</button><button disabled={busy || !number} onClick={() => { const state = practiceProps.controller.getSnapshot(); onSendToEditor({ ...state.score, tempo: state.tempo }) }}>送到 Editor</button></div>
    </div>}
    beforeControls={<div className="random-settings">
      <div className="random-settings-heading"><button aria-expanded={expanded} aria-controls="random-generator-fields" onClick={() => setExpanded(value => !value)}>{expanded ? '收起出题设置' : '展开出题设置'}</button><span>{dirty && number > 0 ? '参数待生成 · 当前题目未改变' : '生成后可重复练习同一份谱'}</span><label>音名提示<select aria-label="随机练习音名提示" value={noteNames} onChange={e => setNoteNames(e.target.value as PracticeNoteNameMode)}><option value="hidden">隐藏</option><option value="letter">C</option><option value="full">C4</option></select></label></div>
      <div id="random-generator-fields" hidden={!expanded}>
        <div className="random-fields">
          <label>预设<select aria-label="出题预设" value={preset} onChange={e => { const item = randomPresets.find(p => p.id === e.target.value); if (item) { setDraft(structuredClone(item.settings)); setPreset(item.id); setError('') } }}><option value="custom" disabled>自定义</option>{randomPresets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label>内容<select aria-label="出题内容" value={draft.type} onChange={e => patch({ type: e.target.value as RandomScoreSettings['type'] })}><option value="note">单音</option><option value="chord">和弦</option></select></label>
          <label>最低音<select aria-label="随机最低音" value={draft.lower} onChange={e => patch({ lower: Number(e.target.value) })}>{pitchOptions}</select></label>
          <label>最高音<select aria-label="随机最高音" value={draft.upper} onChange={e => patch({ upper: Number(e.target.value) })}>{pitchOptions}</select></label>
          <label>拍号<select aria-label="随机拍号" value={draft.timeSignature.join('/')} onChange={e => patch({ timeSignature: e.target.value.split('/').map(Number) as [number, number] })}>{timeSignaturePresets.map(s => <option key={s.join('/')} value={s.join('/')}>{s.join('/')}</option>)}</select></label>
          <label>长度<select aria-label="随机小节数" value={draft.measures} onChange={e => patch({ measures: Number(e.target.value) })}>{[2,4,8,16].map(n => <option key={n} value={n}>{n} 小节</option>)}</select></label>
        </div>
        <details className="random-advanced"><summary>更多出题条件</summary>
          <div className="random-fields">
            {draft.type === 'note' ? <><label>音符池<select aria-label="随机音符池" value={draft.pool} onChange={e => patch({ pool: e.target.value as RandomScoreSettings['pool'] })}><option value="white">白键</option><option value="black">黑键</option><option value="all">全部</option></select></label><label>音高变化<select aria-label="音高变化" value={draft.motion} onChange={e => patch({ motion: e.target.value as RandomScoreSettings['motion'] })}><option value="free">自由跳进</option><option value="near">以相邻音为主</option></select></label></> : <fieldset><legend>和弦类型</legend>{(['major','minor'] as const).map(q => <label className="random-check" key={q}><input type="checkbox" checked={draft.qualities.includes(q)} onChange={e => patch({ qualities: e.target.checked ? [...draft.qualities,q] : draft.qualities.filter(v => v !== q) })} />{q === 'major' ? '大三和弦' : '小三和弦'}</label>)}</fieldset>}
            <label>休止符<select aria-label="随机休止符" value={String(draft.rests)} onChange={e => patch({ rests: e.target.value === 'true' })}><option value="false">关闭</option><option value="true">少量</option></select></label>
          </div>
          <fieldset className="random-durations"><legend>允许的时值（可多选）</legend>{durations.map(d => <label className="random-check" key={d}><input type="checkbox" checked={draft.durations.includes(d)} onChange={e => patch({ durations: e.target.checked ? [...draft.durations,d] : draft.durations.filter(v => v !== d) })} />{durationNames[d]}</label>)}</fieldset>
          <p className="score-hint">所有组成音均限制在音域内。每小节按所选时值完整填满，不自动补入未选择的时值。参数仅在「生成新题」后生效。</p>
        </details>
      </div>
      {error && <p className="random-error" role="alert">{error}</p>}
    </div>}
    emptyContent={<><strong>先出题，再开始练习</strong><p>可直接使用基础认音预设，点击「生成新题」。</p><p>逐音与时间轴跟弹、示范回放、识别带和谱面成绩与乐谱跟练一致。</p></>}
  />
}
