import { midiNumberToPianoNote } from '../data/piano'
import { durations, isSupportedTimeSignature, measureBeats, type ScoreDocument } from '../score/scoreModel'

export interface RandomScoreSettings {
  type: 'note' | 'chord'
  lower: number
  upper: number
  pool: 'all' | 'white' | 'black'
  qualities: ('major' | 'minor')[]
  timeSignature: [number, number]
  measures: number
  durations: number[]
  rests: boolean
  motion: 'free' | 'near'
}
export const defaultRandomScoreSettings: RandomScoreSettings = {
  type: 'note', lower: 60, upper: 72, pool: 'white', qualities: ['major', 'minor'],
  timeSignature: [4, 4], measures: 4, durations: [1], rests: false, motion: 'free',
}
export const randomPresets: { id: string; name: string; settings: RandomScoreSettings }[] = [
  { id: 'reading', name: '基础认音', settings: defaultRandomScoreSettings },
  { id: 'melody', name: '旋律视奏', settings: { ...defaultRandomScoreSettings, durations: [1, 2], motion: 'near' } },
  { id: 'rhythm', name: '混合节奏', settings: { ...defaultRandomScoreSettings, durations: [.5, 1, 2], rests: true, motion: 'near' } },
  { id: 'chords', name: '三和弦练习', settings: { ...defaultRandomScoreSettings, type: 'chord', lower: 48, upper: 72, durations: [2] } },
]

function candidatesFor(settings: RandomScoreSettings): number[][] {
  const candidates: number[][] = []
  for (let pitch = settings.lower; pitch <= settings.upper; pitch++) {
    if (settings.type === 'note') {
      const white = midiNumberToPianoNote(pitch)?.type === 'white'
      if (settings.pool === 'all' || (settings.pool === 'white' ? white : !white)) candidates.push([pitch])
    } else {
      for (const quality of settings.qualities) {
        if (pitch + 7 <= settings.upper) candidates.push([pitch, pitch + (quality === 'major' ? 4 : 3), pitch + 7])
      }
    }
  }
  return candidates
}

/** Integer sixteenth-note ticks prevent fractional accumulation and guarantee exact bars. */
export function generateRandomScore(settings: RandomScoreSettings, random = Math.random, id = crypto.randomUUID()): ScoreDocument {
  if (!Number.isInteger(settings.lower) || !Number.isInteger(settings.upper) || settings.lower < 21 || settings.upper > 108 || settings.lower > settings.upper) throw new Error('请选择 A0–C8 内有效的上下限，最低音不能高于最高音。')
  if (!isSupportedTimeSignature(settings.timeSignature) || ![2, 4, 8, 16].includes(settings.measures)) throw new Error('请选择支持的拍号与 2 / 4 / 8 / 16 小节。')
  if (!['note', 'chord'].includes(settings.type) || !['all', 'white', 'black'].includes(settings.pool) || !['free', 'near'].includes(settings.motion)) throw new Error('出题条件无效。')
  if (!settings.durations.length || settings.durations.some(d => !durations.includes(d as typeof durations[number]))) throw new Error('请至少选择一种有效时值。')
  if (settings.type === 'chord' && (!settings.qualities.length || settings.qualities.some(q => q !== 'major' && q !== 'minor'))) throw new Error('请至少选择一种和弦类型。')
  const candidates = candidatesFor(settings)
  if (!candidates.length) throw new Error(settings.type === 'chord' ? '当前音域无法容纳所选三和弦，请扩大音域。' : '当前音域没有所选音符池的音，请调整音域或音符池。')
  const barTicks = measureBeats(settings.timeSignature) * 4
  const choices = [...new Set(settings.durations)].map(d => d * 4)
  const fillable = Array<boolean>(barTicks + 1).fill(false)
  fillable[0] = true
  for (let ticks = 1; ticks <= barTicks; ticks++) fillable[ticks] = choices.some(d => d <= ticks && fillable[ticks - d])
  if (!fillable[barTicks]) throw new Error('所选时值无法填满一个小节，请增加较短时值或更换拍号。')
  const pick = <T,>(items: T[]): T => items[Math.min(items.length - 1, Math.max(0, Math.floor(random() * items.length)))]
  const events: ScoreDocument['events'] = []
  let position = 0
  let previous: number | undefined
  for (let bar = 0; bar < settings.measures; bar++) {
    let remaining = barTicks
    while (remaining) {
      const ticks = pick(choices.filter(d => d <= remaining && fillable[remaining - d]))
      let pool = candidates
      if (settings.type === 'note' && settings.motion === 'near' && previous !== undefined && random() < .8) {
        const nearby = candidates.filter(p => p[0] !== previous && Math.abs(p[0] - previous!) <= 4)
        if (nearby.length) pool = nearby
      }
      // Begin every bar with a sounding target, so even sparse exercises remain playable.
      const rest = settings.rests && remaining !== barTicks && random() < .15
      const pitches = rest ? [] : [...pick(pool)]
      if (pitches.length) previous = pitches[0]
      events.push({ id: `${id}-${events.length}`, startBeat: position / 4, duration: ticks / 4, pitches })
      position += ticks; remaining -= ticks
    }
  }
  return { version: 1, title: `随机${settings.type === 'note' ? '单音' : '和弦'} · ${settings.measures} 小节`, tempo: 90, timeSignature: [...settings.timeSignature], events }
}

export function randomScoreSummary(settings: RandomScoreSettings) {
  const pool = settings.type === 'chord' ? settings.qualities.map(q => q === 'major' ? '大三' : '小三').join(' / ') : { all: '全部音', white: '白键', black: '黑键' }[settings.pool]
  return `${midiNumberToPianoNote(settings.lower)?.name}–${midiNumberToPianoNote(settings.upper)?.name} · ${pool} · ${settings.timeSignature.join('/')} · ${settings.measures} 小节`
}
