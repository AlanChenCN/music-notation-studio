import GrandStaff from '../components/GrandStaff'
import { pianoNotes } from '../data/piano'
import { analyzeChord } from '../music/chordAnalyzer'
import { formatChordName } from '../music/chord'
import type { NoteDisplayMode } from '../music/noteDisplay'
interface Props { active: boolean; pressedNotes: string[]; recentNotes: string[]; onClear: () => void; display: NoteDisplayMode; onDisplayChange: (mode: NoteDisplayMode) => void }
export default function FreePlay({ active, pressedNotes, recentNotes, onClear, display, onDisplayChange }: Props) {
  const chord = analyzeChord(pianoNotes.filter(note => pressedNotes.includes(note.name)))
  const recentChord = analyzeChord(pianoNotes.filter(note => recentNotes.includes(note.name)))
  return <section hidden={!active} className="score-editor free-play" aria-label="自由弹奏">
    <div className="score-document-bar"><div className="random-document-info"><strong>自由弹奏</strong><span className="score-summary">试音 · 看谱 · 查看和弦</span></div></div>
    <div className="score-entry trainer-entry"><label>音名显示<select aria-label="自由弹奏音名显示" value={display} onChange={e => onDisplayChange(e.target.value as NoteDisplayMode)}><option value="hidden">隐藏</option><option value="letter">音名</option><option value="solfege">唱名</option></select></label><span className="score-hint">使用电脑键盘、鼠标或 MIDI 自由试弹</span><div className="trainer-session-actions"><button disabled={!!pressedNotes.length || !recentNotes.length} onClick={onClear}>清除最近试音</button></div></div>
    <GrandStaff pressedNotes={pressedNotes} targetNotes={[]} practicePhrase={null} currentTargetIndex={-1} playbackBeat={0} playbackActive={false} practiceType="note" noteDisplayMode={display} practiceNoteNameMode="hidden" chord={chord} />
    <div className="trainer-metrics free-play-info" aria-label="最近试音"><span>最近完整试音 <strong>{recentNotes.join(' · ') || '—'}</strong></span><span>和弦 <strong>{recentChord ? formatChordName(recentChord) : '—'}</strong></span></div>
    <p className="score-hint">全部松键后保留这一组试音；同组以最后一次按下新键时的同时持音为准。和弦名称目前识别大／小三和弦。</p>
  </section>
}
