import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { pianoNoteToMidiNumber } from '../data/piano'
import { ScoreTransport } from '../score/scoreTransport'
import type { ScoreDocument } from '../score/scoreModel'
import type { PracticePhrase } from './practiceTypes'

interface Props {
  phrase: PracticePhrase | null
  enabled: boolean
  currentTargetIndex: number
  onPlayNote: (pitch: number) => void
  onStopNote: (pitch: number) => void
  onPlaybackChange: (beat: number, playing: boolean) => void
}

function scoreForPhrase(phrase: PracticePhrase | null, tempo: number): ScoreDocument {
  return { version: 1, title: '练习回放', tempo, timeSignature: [4, 4], events: (phrase?.notes ?? []).map(note => ({ id: note.id, startBeat: note.index, duration: 1, pitches: note.targetNotes.map(pianoNoteToMidiNumber).filter((pitch): pitch is number => pitch !== undefined) })) }
}

export default function PracticeTransport({ phrase, enabled, currentTargetIndex, onPlayNote, onStopNote, onPlaybackChange }: Props) {
  const [tempo, setTempo] = useState(90)
  const score = useMemo(() => scoreForPhrase(phrase, tempo), [phrase, tempo])
  const transport = useMemo(() => new ScoreTransport(score, onPlayNote, onStopNote), [score, onPlayNote, onStopNote])
  const playback = useSyncExternalStore(transport.subscribe, transport.getSnapshot, transport.getSnapshot)
  const length = score.events.length

  useEffect(() => () => transport.pause(), [transport])
  useEffect(() => { if (!enabled) transport.pause() }, [enabled, transport])
  useEffect(() => { onPlaybackChange(playback.beat, playback.playing) }, [onPlaybackChange, playback])

  function updateTempo(nextTempo: number) { setTempo(Math.max(30, Math.min(240, nextTempo))) }

  return <div className="score-transport trainer-transport" aria-label="练习回放">
    <div className="score-progress-group">
      <label className="score-progress"><input aria-label="练习播放进度" type="range" min="0" max={length || 1} step="0.01" disabled={!enabled || !length} value={playback.beat} onChange={event => transport.seek(Number(event.target.value))} /></label>
      <output>{playback.beat.toFixed(1)} / {length} 拍</output>
    </div>
    <span className="score-transport-divider" aria-hidden="true" />
    <div className="score-transport-actions" aria-label="练习播放控制">
      <button className="score-locate-toggle" disabled={!enabled || currentTargetIndex < 0} onClick={() => transport.seek(currentTargetIndex)} aria-label="定位到当前练习目标" title="定位到当前练习目标"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg></button>
      <button className="score-play-toggle score-primary" disabled={!enabled || !length} onClick={playback.playing ? transport.pause : transport.play} aria-label={playback.playing ? '暂停练习回放' : '开始练习回放'}>{playback.playing ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="5" width="3.5" height="14" rx="1" /><rect x="13.5" y="5" width="3.5" height="14" rx="1" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5 18 12 8 18.5Z" /></svg>}</button>
    </div>
    <span className="score-transport-divider" aria-hidden="true" />
    <div className="score-tempo" aria-label="速度 BPM"><span>BPM</span><button aria-label="速度降低 10 BPM" disabled={!enabled || tempo <= 30} onClick={() => updateTempo(tempo - 10)}>−</button><input aria-label="速度 BPM 数值" type="number" min="30" max="240" key={tempo} defaultValue={tempo} disabled={!enabled} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur() }} onBlur={event => { const value = Number(event.target.value); if (value >= 30 && value <= 240) updateTempo(value); else event.target.value = String(tempo) }} /><button aria-label="速度提高 10 BPM" disabled={!enabled || tempo >= 240} onClick={() => updateTempo(tempo + 10)}>+</button></div>
  </div>
}
