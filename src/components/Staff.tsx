import { useEffect, useRef, useState } from 'react'
import { noteName, sessionBeat, type Session } from '../practice'

const steps = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]
const pitchStep = (pitch: number) => Math.floor(pitch / 12) * 7 + steps[pitch % 12]

export default function Staff({ session }: { session: Session }) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 720, height: 240 })
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      if (width && height) setSize({ width, height })
    })
    observer.observe(ref.current!)
    return () => observer.disconnect()
  }, [])
  const { width, height } = size
  const bass = session.config.clef === 'bass'
  const baseStep = pitchStep(bass ? 43 : 64)
  const highest = Math.max(baseStep + 8, pitchStep(session.config.high) + 6)
  const lowest = Math.min(baseStep, pitchStep(session.config.low) - 2)
  // Reserve a stable bottom lane for labels even when they are hidden.
  const gap = Math.min(18, Math.max(5, (height - 54) * 2 / (highest - lowest)))
  const y = (step: number) => 14 + (highest - step) * gap / 2
  const bottom = y(baseStep)
  const top = y(baseStep + 8)
  const beat = session.mode === 'rhythm' ? Math.max(-1, sessionBeat(session)) : session.index
  const spacing = Math.max(62, Math.min(112, (width - 100) / 5))
  const anchor = Math.max(110, width * 0.27)
  const reading = session.mode === 'reading'
  const x = (index: number) => anchor + (index - (reading ? 0 : beat)) * spacing
  const held = [...new Set(Object.values(session.held))]
  return <div className="staff" ref={ref}>
    <svg width={width} height={height} role="img" aria-label={`${bass ? '低' : '高'}音谱表，当前目标 ${noteName(session.notes[session.index])}`}>
      <defs><clipPath id="notes-clip"><rect x="78" y="0" width={Math.max(0, width - 78)} height={height} /></clipPath></defs>
      {Array.from({ length: 5 }, (_, i) => <line key={i} x1="18" x2={width - 12} y1={bottom - i * gap} y2={bottom - i * gap} className="staff-line" />)}
      <text x="25" y={bass ? top + gap * 3 : bottom - gap * .2} className="clef" fontSize={gap * (bass ? 3.7 : 5.4)}>{bass ? '𝄢' : '𝄞'}</text>
      <g clipPath="url(#notes-clip)">
        {session.mode === 'rhythm' && <><rect x={anchor - spacing * .3} y="6" width={spacing * .6} height={height - 12} className="timing-band" /><line x1={anchor} x2={anchor} y1="6" y2={height - 6} className="play-axis" /></>}
        <g className={reading ? 'reading-note-track' : undefined} style={reading ? { transform: `translateX(${-session.index * spacing}px)` } : undefined}>
        {Array.from({ length: Math.ceil(session.notes.length / 4) + 1 }, (_, measure) => {
          const end = measure * 4 === session.notes.length
          const cx = x(measure * 4 - .5)
          return <g key={`measure-${measure}`} className="measure-boundary" aria-label={end ? '终止线' : `第 ${measure + 1} 小节起点`}>
            <line x1={cx} x2={cx} y1={top} y2={bottom} className={end ? 'barline final-barline' : 'barline'} />
            {end && <line x1={cx - 5} x2={cx - 5} y1={top} y2={bottom} className="barline" />}
          </g>
        })}
        {session.notes.map((pitch, index) => {
          const cx = x(index)
          // Keep reading targets mounted so incoming notes move across the clip edge.
          if (!reading && (cx < 64 || cx > width + 20)) return null
          const step = pitchStep(pitch)
          const cy = y(step)
          const active = index === session.index && session.status !== 'complete'
          const result = session.results[index]
          const ledger: number[] = []
          if (step < baseStep) for (let s = baseStep - 2; s >= step; s -= 2) ledger.push(s)
          if (step > baseStep + 8) for (let s = baseStep + 10; s <= step; s += 2) ledger.push(s)
          const up = step < baseStep + 4
          const r = Math.max(5, gap * .55)
          return <g key={index} className={`score-note ${active ? 'active' : ''} ${result}`}>
            {ledger.map(s => <line key={s} x1={cx - r - 5} x2={cx + r + 5} y1={y(s)} y2={y(s)} className="ledger" />)}
            {[1, 3, 6, 8, 10].includes(pitch % 12) && <text x={cx - r - 13} y={cy + 5} fontSize={gap * 1.45}>♯</text>}
            <ellipse cx={cx} cy={cy} rx={r} ry={r * .7} transform={`rotate(-18 ${cx} ${cy})`} />
            <line x1={cx + (up ? r - 1 : -r + 1)} x2={cx + (up ? r - 1 : -r + 1)} y1={cy} y2={cy + (up ? -1 : 1) * gap * 3} className="stem" />
            {session.config.labels && <text x={cx} y={height - 24} textAnchor="middle" className="note-label">{noteName(pitch)}</text>}
            {result !== 'pending' && <text x={cx} y="18" textAnchor="middle" className="result-mark">{result === 'hit' ? '✓' : '×'}</text>}
          </g>
        })}
        </g>
        {reading && session.status !== 'complete' && <circle cx={anchor} cy={height - 12} r="3" className="reading-anchor" />}
        {held.filter(pitch => pitch >= session.config.low - 12 && pitch <= session.config.high + 12).map(pitch => <ellipse key={pitch} cx={anchor} cy={y(pitchStep(pitch))} rx={gap * .7} ry={gap * .52} className="played-note" />)}
      </g>
    </svg>
  </div>
}
