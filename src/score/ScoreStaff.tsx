import { useEffect, useMemo, useRef } from 'react'
import { midiNumberToPianoNote } from '../data/piano'
import { getStaffNotePosition, getLedgerLineSteps, type StaffName } from '../data/staff'
import { createGrandStaffGeometry, staffLineSteps } from '../data/staffGeometry'
import { notationSegments } from './notation'
import { measureBeats, scoreLength, type ScoreDocument } from './scoreModel'

interface Props { followLeft?: boolean; livePitches?: number[]; liveAtCursor?: boolean; readOnly?: boolean; score: ScoreDocument; selected: string | null; beat: number; playing: boolean; previewPitches: number[]; previewDuration: number; insertionIndex: number; onSelect: (id: string) => void; onEnd: () => void }

const { staffBottomY, noteY } = createGrandStaffGeometry(199, 6)
const staffTopY = noteY('treble', 8)
const staffBottomEdgeY = noteY('bass', 0)
// Fit the complete grand-staff area, while keeping measure numbers and beat labels
// outside hover and selection outlines.
const eventFrameTopY = staffTopY - 28
const eventFrameBottomY = staffBottomEdgeY + 28
const beatFraction = (value: number) => ({ .25: ['1', '4'], .5: ['1', '2'] } as Record<number, [string, string] | undefined>)[value]
const isMeasureStart = (beat: number, beatsPerMeasure: number) => Math.abs(beat / beatsPerMeasure - Math.round(beat / beatsPerMeasure)) < .00001

export default function ScoreStaff({ score, selected, beat, playing, previewPitches, previewDuration, insertionIndex, onSelect, onEnd, readOnly = false, followLeft = false, livePitches = [], liveAtCursor = false }: Props) {
  const paperRef = useRef<HTMLDivElement>(null)
  const followPosition = useRef(0)
  const beatsPerMeasure = measureBeats(score.timeSignature)
  const { segments, widths, xs, offset, width, eventById, previewAnchorX, previewLayoutWidth, editCursorX } = useMemo(() => {
    const segments = notationSegments(score)
    // Keep a readable minimum for accidentals and chords, then let musical time drive spacing.
    const widths = segments.map(segment => Math.max(44, segment.pitches.length * 18 + 28, segment.duration * 66))
    const xs = [100]
    for (const itemWidth of widths) xs.push(xs[xs.length - 1] + itemWidth)
    const offset = xs[xs.length - 1]
    const nextEvent = score.events[insertionIndex]
    const nextSegmentIndex = nextEvent
      ? segments.findIndex(segment => segment.eventId === nextEvent.id)
      : -1
    const previewAnchorX = nextSegmentIndex >= 0 ? xs[nextSegmentIndex] - 8 : offset
    const selectedIndex = selected ? segments.findIndex(segment => segment.eventId === selected) : -1
    const editCursorX = selectedIndex >= 0 ? xs[selectedIndex] - 8 : previewAnchorX
    // A preview stays anchored to the editing slot. At the end, use a quarter-note slot.
    const previewLayoutWidth = selectedIndex >= 0 ? widths[selectedIndex] : 66
    return { segments, widths, xs, offset, width: Math.max(800, offset + 82), eventById: new Map(score.events.map(event => [event.id, event])), previewAnchorX, previewLayoutWidth, editCursorX }
  }, [score, insertionIndex, selected])
  const activeIndex = segments.findIndex(segment => beat >= segment.beat && beat < segment.beat + segment.duration)
  const playX = activeIndex < 0 ? offset : xs[activeIndex] - 8 + (beat - segments[activeIndex].beat) / segments[activeIndex].duration * widths[activeIndex]
  useEffect(() => {
    const paper = paperRef.current
    if (!paper || playing || followLeft) return
    const svg = paper.querySelector('svg')
    if (!svg) return
    const position = editCursorX * (svg.clientWidth / width)
    const safeLeft = paper.scrollLeft + paper.clientWidth * .2
    const safeRight = paper.scrollLeft + paper.clientWidth * .8
    if (position < safeLeft || position > safeRight) {
      const edge = position < safeLeft ? paper.clientWidth * .2 : paper.clientWidth * .8
      paper.scrollTo({ left: Math.max(0, position - edge), behavior: 'smooth' })
    }
  }, [editCursorX, playing, width, followLeft])
  useEffect(() => {
    const paper = paperRef.current
    if (!paper || (!playing && !followLeft)) return
    const svg = paper.querySelector('svg')
    if (!svg) return
    const position = playX * (svg.clientWidth / width)
    if (followLeft) { followPosition.current = playX; paper.scrollLeft = position; return }
    const safeLeft = paper.scrollLeft + paper.clientWidth * .2
    const safeRight = paper.scrollLeft + paper.clientWidth * .8
    if (position < safeLeft || position > safeRight) {
      const edge = position < safeLeft ? paper.clientWidth * .2 : paper.clientWidth * .8
      // Playback publishes on every animation frame. Updating the native scroll position
      // directly keeps the cursor at the boundary without stacking smooth-scroll animations.
      paper.scrollLeft = Math.max(0, position - edge)
    }
  }, [playX, playing, width, followLeft])
  useEffect(() => {
    const paper = paperRef.current
    if (!followLeft || !paper) return
    const observer = new ResizeObserver(() => {
      const svg = paper.querySelector('svg')
      if (svg) paper.scrollLeft = followPosition.current * svg.clientWidth / width
    })
    observer.observe(paper)
    return () => observer.disconnect()
  }, [followLeft, width])
  const notation = useMemo(() => <g>
      {(['treble', 'bass'] as StaffName[]).map(staff => <g key={staff} stroke="var(--theme-staff-color)" strokeWidth="1">
        {staffLineSteps.map(step => <line key={step} x1="20" x2={width - 20} y1={noteY(staff, step)} y2={noteY(staff, step)} />)}
      </g>)}
      <g fill="var(--theme-staff-color)" fontFamily="Noto Music, Segoe UI Symbol, Bravura, serif">
        <text x="45" y={noteY('treble', 4) + 17} fontSize="62" textAnchor="middle">𝄞</text>
        <text x="45" y={noteY('bass', 4) + 12} fontSize="54" textAnchor="middle">𝄢</text>
        {(['treble', 'bass'] as StaffName[]).map(staff => <g key={`time-${staff}`} fontSize="24" textAnchor="middle">
          <text x="78" y={noteY(staff, 4) - 8}>{score.timeSignature[0]}</text>
          <text x="78" y={noteY(staff, 4) + 16}>{score.timeSignature[1]}</text>
        </g>)}
      </g>
      {!segments.length && !previewPitches.length && <text x="180" y="181" fill="var(--theme-text-color)" fontSize="18">在底部琴键试音，然后点击「写入音符」</text>}
      {segments.map((segment, index) => {
        const slotStartX = xs[index] - 8
        const x = followLeft ? slotStartX : slotStartX + widths[index] / 2
        const chosen = selected === segment.eventId
        const event = eventById.get(segment.eventId)!
        const label = `${segment.beat + 1} 拍：${segment.pitches.map(pitch => midiNumberToPianoNote(pitch)?.name).join('、') || '休止符'}，${event.duration} 拍`
        return <g key={`${segment.eventId}-${segment.beat}`}>
          {isMeasureStart(segment.beat, beatsPerMeasure) && <g fill="var(--theme-text-color)" stroke="var(--theme-border-color)">
            <line x1={xs[index] - 8} x2={xs[index] - 8} y1={staffTopY - 8} y2={staffBottomEdgeY + 8} />
            <text x={xs[index]} y="36" stroke="none" fontSize="13">{Math.round(segment.beat / beatsPerMeasure) + 1}</text>
          </g>}
          <g role="button" tabIndex={0} aria-label={label} aria-pressed={chosen} onClick={() => onSelect(segment.eventId)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(segment.eventId) } }} className="score-note-target">
            <title>{label}</title>
            <rect className={`score-event-frame${chosen ? ' score-event-frame--selected' : ''}`} x={slotStartX} y={eventFrameTopY} width={widths[index]} height={eventFrameBottomY - eventFrameTopY} rx="8" />
            <g pointerEvents="none" fill={chosen ? 'var(--theme-left-hand-color)' : 'var(--theme-heading-color)'} stroke={chosen ? 'var(--theme-left-hand-color)' : 'var(--theme-heading-color)'}>
              {!segment.pitches.length && <text x={x - 8} y="155" stroke="none" fontSize="30" fontFamily="Segoe UI Symbol, serif">{segment.duration === 4 ? '𝄻' : segment.duration === 2 ? '𝄼' : segment.duration === 1 ? '𝄽' : segment.duration === .5 ? '𝄾' : '𝄿'}</text>}
              {segment.pitches.map((pitch, noteIndex) => {
                const note = midiNumberToPianoNote(pitch)!
                const position = getStaffNotePosition(note)
                const bottom = staffBottomY[position.staff]
                const y = noteY(position.staff, position.staffStep)
                const previous = midiNumberToPianoNote(segment.pitches[noteIndex - 1])
                const nearPrevious = previous && Math.abs(getStaffNotePosition(previous).staffStep - position.staffStep) <= 1 && getStaffNotePosition(previous).staff === position.staff
                const staffPositions = segment.pitches.map(value => getStaffNotePosition(midiNumberToPianoNote(value)!)).filter(value => value.staff === position.staff)
                const topStep = Math.max(...staffPositions.map(value => value.staffStep))
                const bottomStep = Math.min(...staffPositions.map(value => value.staffStep))
                const stemDown = (topStep + bottomStep) / 2 >= 4
                const nx = x + (nearPrevious && noteIndex % 2 ? (stemDown ? -13 : 13) : 0)
                const stemX = x + (stemDown ? -7 : 7)
                const stemEnd = stemDown ? bottom - bottomStep * 6 + 33 : bottom - topStep * 6 - 33
                const topNote = position.staffStep === topStep && !segment.pitches.slice(noteIndex + 1).some(value => {
                  const other = getStaffNotePosition(midiNumberToPianoNote(value)!)
                  return other.staff === position.staff && other.staffStep === topStep
                })
                return <g key={pitch}>
                  {getLedgerLineSteps(position.staffStep).map(step => <line key={step} x1={nx - 13} x2={nx + 13} y1={noteY(position.staff, step)} y2={noteY(position.staff, step)} />)}
                  {!segment.tiedFrom && note.type === 'black' && <text x={x - 17 - noteIndex * 10} y={y + 5} fontSize="17" stroke="none">♯</text>}
                  <ellipse cx={nx} cy={y} rx={segment.duration === 4 ? 10 : 8} ry="5.5" transform={`rotate(-15 ${nx} ${y})`} fill={segment.duration >= 2 ? 'var(--theme-score-background)' : undefined} strokeWidth="1.8" />
                  {segment.duration < 4 && topNote && <line x1={stemX} x2={stemX} y1={stemDown ? y + 2 : bottom - bottomStep * 6 - 2} y2={stemEnd} strokeWidth="1.5" />}
                  {segment.duration < 1 && topNote && <path d={`M ${stemX} ${stemEnd} q 17 ${stemDown ? -9 : 9} 8 ${stemDown ? -21 : 21}`} fill="none" strokeWidth="2.5" />}
                  {segment.duration === .25 && topNote && <path d={`M ${stemX} ${stemEnd + (stemDown ? -8 : 8)} q 17 ${stemDown ? -9 : 9} 8 ${stemDown ? -21 : 21}`} fill="none" strokeWidth="2.5" />}
                  {segment.tiedTo && <path d={`M ${nx + 5} ${y + 9} Q ${nx + widths[index] / 2} ${y + 25} ${x + widths[index] - 5} ${y + 9}`} fill="none" strokeWidth="1.5" />}
                </g>
              })}
            </g>
            {beatFraction(segment.duration)
              ? <g fill="var(--theme-text-color)" stroke="var(--theme-text-color)" strokeWidth="1" fontSize="10" textAnchor="middle"><text x={xs[index] + 12} y="365" stroke="none">{beatFraction(segment.duration)?.[0]}</text><line x1={xs[index] + 7} x2={xs[index] + 17} y1="369" y2="369" /><text x={xs[index] + 12} y="380" stroke="none">{beatFraction(segment.duration)?.[1]}</text><text x={xs[index] + 25} y="376" textAnchor="start" stroke="none">b</text></g>
              : <text x={xs[index] + 6} y="374" fill="var(--theme-text-color)" fontSize="12">{segment.duration} b{segment.tiedFrom && segment.pitches.length ? ' · 延音' : ''}</text>}
          </g>
        </g>
      })}
      {!!previewPitches.length && <g className="score-note-preview" aria-label={`待写入：${previewPitches.map(pitch => midiNumberToPianoNote(pitch)?.name).join('、')}，${previewDuration} 拍`}>
        <line x1={previewAnchorX} x2={previewAnchorX} y1={staffTopY - 14} y2={staffBottomEdgeY + 14} stroke="var(--theme-accent-color)" strokeWidth="2" opacity="0.7" />
        <path d={`M ${previewAnchorX - 5} ${staffTopY - 18} L ${previewAnchorX + 5} ${staffTopY - 18} L ${previewAnchorX} ${staffTopY - 11} Z`} fill="var(--theme-accent-color)" />
        <text x={previewAnchorX + 8} y={staffTopY - 16} fill="var(--theme-accent-color)" fontSize="12">待写入 · {previewDuration} 拍</text>
        <g fill="var(--theme-accent-color)" stroke="var(--theme-accent-color)" opacity="0.88" pointerEvents="none">
          {previewPitches.map((pitch, index) => {
            const note = midiNumberToPianoNote(pitch)!
            const position = getStaffNotePosition(note)
            const previous = midiNumberToPianoNote(previewPitches[index - 1])
            const nearPrevious = previous && getStaffNotePosition(previous).staff === position.staff && Math.abs(getStaffNotePosition(previous).staffStep - position.staffStep) <= 1
            const x = previewAnchorX + previewLayoutWidth / 2 + (nearPrevious && index % 2 ? 12 : 0)
            const y = noteY(position.staff, position.staffStep)
            return <g key={pitch}>
              {getLedgerLineSteps(position.staffStep).map(step => <line key={step} x1={x - 13} x2={x + 13} y1={noteY(position.staff, step)} y2={noteY(position.staff, step)} />)}
              {note.type === 'black' && <text x={x - 21} y={y + 5} fontSize="17" stroke="none">♯</text>}
              <ellipse cx={x} cy={y} rx={previewDuration === 4 ? 10 : 8} ry="5.5" transform={`rotate(-15 ${x} ${y})`} fill={previewDuration >= 2 ? 'var(--theme-score-background)' : undefined} strokeWidth="1.8" />
              {previewDuration < 4 && <line x1={x + 7} x2={x + 7} y1={y} y2={y - 33} strokeWidth="1.5" />}
              {previewDuration < 1 && <path d={`M ${x + 7} ${y - 33} q 17 9 8 21`} fill="none" strokeWidth="2.5" />}
              {previewDuration === .25 && <path d={`M ${x + 7} ${y - 25} q 17 9 8 21`} fill="none" strokeWidth="2.5" />}
            </g>
          })}
        </g>
      </g>}
      {!readOnly && <g role="button" tabIndex={0} aria-label="在末尾继续写入" onClick={onEnd} onKeyDown={e => { if (e.key === 'Enter') onEnd() }} className="score-note-target">
        <rect className="score-end-slot" x={offset} y={(staffTopY + staffBottomEdgeY) / 2 - 68} width="66" height="136" rx="8" fill={selected === null ? 'var(--theme-accent-background)' : 'transparent'} />
        <text x={offset + 25} y={(staffTopY + staffBottomEdgeY) / 2 + 8} fill="var(--theme-accent-color)" fontSize="24">+</text>
      </g>
      }
    </g>, [followLeft, readOnly, segments, widths, xs, offset, width, eventById, selected, previewAnchorX, previewLayoutWidth, previewPitches, previewDuration, beatsPerMeasure, score.timeSignature, onSelect, onEnd])
  return <div ref={paperRef} className="score-paper" aria-label="乐谱五线谱，可横向滚动">
    <div style={followLeft ? { width, paddingLeft: '20%', paddingRight: '80%', boxSizing: 'content-box' } : undefined}>
    <svg width={width} height="400" viewBox={`0 0 ${width} 400`} role="group" aria-label={`${score.timeSignature[0]}/${score.timeSignature[1]} 乐谱`}>
      {notation}
      {!followLeft && <line className="score-edit-cursor" x1={editCursorX} x2={editCursorX} y1="48" y2="365" pointerEvents="none" />}
      {scoreLength(score) > 0 && <line className={playing ? 'score-playback-cursor score-playback-cursor--active' : 'score-playback-cursor'} x1={playX} x2={playX} y1="48" y2="365" pointerEvents="none" />}
      {!!livePitches.length && <g className="score-live-notes" aria-label={`实奏音符：${livePitches.map(p => midiNumberToPianoNote(p)?.name).join('、')}`} fill="none" stroke="var(--theme-accent-color)" strokeWidth="2.5" pointerEvents="none">
        {livePitches.map((pitch, index) => {
          const note = midiNumberToPianoNote(pitch)
          if (!note) return null
          const position = getStaffNotePosition(note)
          const x = (liveAtCursor ? playX : previewAnchorX + previewLayoutWidth / 2) + 18 + (index % 2) * 10
          const y = noteY(position.staff, position.staffStep)
          return <g key={pitch} data-live-pitch={pitch}>
            {getLedgerLineSteps(position.staffStep).map(step => <line key={step} x1={x - 13} x2={x + 13} y1={noteY(position.staff, step)} y2={noteY(position.staff, step)} />)}
            <ellipse cx={x} cy={y} rx="9" ry="6" transform={`rotate(-15 ${x} ${y})`} />
            {note.type === 'black' && <text x={x - 23} y={y + 5} fontSize="17" fill="var(--theme-accent-color)" stroke="none">♯</text>}
          </g>
        })}
      </g>}
    </svg>
    </div>
  </div>
}
