export type Mode = 'reading' | 'rhythm'
export type Status = 'ready' | 'running' | 'paused' | 'complete'
export type Result = 'pending' | 'hit' | 'miss'
export interface PracticeConfig {
  strategy: 'random' | 'stepwise' | 'leaps'
  clef: 'treble' | 'bass'
  low: number
  high: number
  pool: 'white' | 'all'
  length: number
  bpm: number
  labels: boolean
}
export const defaultConfig: PracticeConfig = {
  strategy: 'random', clef: 'treble', low: 60, high: 72, pool: 'white', length: 16, bpm: 80, labels: false,
}
export const practicePresets = [
  { id: 'central', name: '中央 C 附近', clef: 'treble', low: 60, high: 67, pool: 'white' },
  { id: 'treble', name: '高音谱表 · C4–C5', clef: 'treble', low: 60, high: 72, pool: 'white' },
  { id: 'bass', name: '低音谱表 · C3–C4', clef: 'bass', low: 48, high: 60, pool: 'white' },
] as const
export const strategyHelp = {
  random: '在所选音域内随机出题，允许重复同音。',
  stepwise: '每次向上或向下走一个相邻音；白键按相邻白键，全部音按半音推进。',
  leaps: '白键练习三度或五度跳进；全部音练习小三度、大三度或纯五度。',
}
const naturals = [0, 2, 4, 5, 7, 9, 11]
export const isNatural = (pitch: number) => naturals.includes(pitch % 12)
export function noteName(pitch: number): string {
  return `${['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][pitch % 12]}${Math.floor(pitch / 12) - 1}`
}
export function generateNotes(config: PracticeConfig, random = Math.random): number[] {
  const pool: number[] = []
  for (let pitch = config.low; pitch <= config.high; pitch++) {
    if (config.pool === 'all' || isNatural(pitch)) pool.push(pitch)
  }
  if (!pool.length) throw new Error('当前音域没有可用音符，请调整音域或音符范围。')
  const choose = (values: number[]) => values[Math.max(0, Math.min(values.length - 1, Math.floor(random() * values.length)))]
  if (config.strategy === 'random') return Array.from({ length: config.length }, () => choose(pool))
  const neighbors = (pitch: number) => pool.filter(candidate => {
    const distance = config.pool === 'white' ? Math.abs(pool.indexOf(candidate) - pool.indexOf(pitch)) : Math.abs(candidate - pitch)
    return config.strategy === 'stepwise' ? distance === 1 : (config.pool === 'white' ? [2, 4] : [3, 4, 7]).includes(distance)
  })
  const starts = pool.filter(pitch => neighbors(pitch).length > 0)
  if (!starts.length) throw new Error(config.strategy === 'stepwise' ? '级进至少需要两个可用音符，请扩大音域或改用随机出题。' : '当前音域无法进行跳进，请扩大音域或改用随机出题。')
  const notes = [choose(starts)]
  while (notes.length < config.length) notes.push(choose(neighbors(notes[notes.length - 1])))
  return notes
}
export interface Session {
  mode: Mode
  config: PracticeConfig
  notes: number[]
  status: Status
  index: number
  results: Result[]
  held: Record<string, number>
  matched: boolean
  attemptWrong: boolean
  errors: number
  feedback: string
  elapsed: number
  startedAt: number
}
export const timingWindow = 0.3 // Quarter-note beats, measured around each target onset.
export function createSession(mode: Mode, config: PracticeConfig, notes: number[]): Session {
  return {
    mode, config: { ...config }, notes, status: 'ready', index: 0,
    results: notes.map(() => 'pending'), held: {}, matched: false, attemptWrong: false,
    errors: 0, feedback: '准备好后，开始练习', elapsed: 0, startedAt: 0,
  }
}
export const sessionBeat = (state: Session) => state.elapsed * state.config.bpm / 60_000 - 4
export type Action =
  | { type: 'labels'; visible: boolean }
  | { type: 'start'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'input'; key: string; pitch: number; down: boolean; now: number }
  | { type: 'release-source'; source: string; now: number }
  | { type: 'reset'; session: Session }

function tick(state: Session, now: number): Session {
  if (state.status !== 'running' || state.mode !== 'rhythm') return state
  const elapsed = Math.max(state.elapsed, now - state.startedAt)
  const beat = elapsed * state.config.bpm / 60_000 - 4
  const results = state.results.map((result, i) => result === 'pending' && beat > i + timingWindow ? 'miss' as const : result)
  const complete = beat >= state.notes.length
  return { ...state, elapsed, results, index: Math.max(0, Math.min(state.notes.length - 1, Math.floor(beat + timingWindow))),
    status: complete ? 'complete' : 'running', feedback: complete ? '本轮完成，看看你的练习结果' : beat < 0 ? `预备 · ${Math.ceil(-beat)}` : state.feedback.startsWith('预备') ? '跟随播放轴，在节拍中弹奏' : state.feedback }
}
export function sessionReducer(state: Session, action: Action): Session {
  if (action.type === 'labels') return { ...state, config: { ...state.config, labels: action.visible } }
  if (action.type === 'reset') return { ...action.session, held: state.held }
  if (action.type === 'tick') return tick(state, action.now)
  if (action.type === 'start') {
    if (Object.keys(state.held).length || state.status === 'complete') return state
    return { ...state, status: 'running', startedAt: action.now - state.elapsed,
      feedback: state.mode === 'reading' ? '弹奏当前目标音符' : state.elapsed === 0 ? '预备 · 4' : '跟随播放轴，在节拍中弹奏' }
  }
  if (action.type === 'pause') {
    if (state.status !== 'running') return state
    const next = tick(state, action.now)
    if (next.status === 'complete') return next
    return { ...next, status: 'paused', matched: false, attemptWrong: false, feedback: '已暂停，松开琴键后可继续' }
  }
  if (action.type === 'release-source') {
    const held = Object.fromEntries(Object.entries(state.held).filter(([key]) => !key.startsWith(`${action.source}:`)))
    return { ...tick(state, action.now), held, matched: false, attemptWrong: false }
  }
  let next = tick(state, action.now)
  const held = { ...next.held }
  if (action.down) {
    if (held[action.key] !== undefined) return next
    held[action.key] = action.pitch
  } else delete held[action.key]
  next = { ...next, held }
  if (next.status !== 'running') return next
  if (next.mode === 'reading') {
    if (action.down) {
      const correct = Object.values(held).every(pitch => pitch === next.notes[next.index])
      return { ...next, matched: correct, attemptWrong: next.attemptWrong || !correct,
        errors: next.errors + (!correct && !next.attemptWrong ? 1 : 0), feedback: correct ? '音高正确 · 松键后继续' : '再试一次 · 请先松开琴键' }
    }
    if (!Object.keys(held).length) {
      if (!next.matched) return { ...next, attemptWrong: false }
      const results = [...next.results]
      results[next.index] = 'hit'
      const complete = next.index === next.notes.length - 1
      return { ...next, results, matched: false, attemptWrong: false, index: complete ? next.index : next.index + 1,
        status: complete ? 'complete' : 'running', feedback: complete ? '本轮完成，看看你的练习结果' : '很好 · 继续下一个音符' }
    }
    return next
  }
  if (!action.down) return next
  const beat = sessionBeat(next)
  if (beat < 0) return next
  const target = Math.round(beat)
  if (target < 0 || target >= next.notes.length || Math.abs(beat - target) > timingWindow) {
    return { ...next, errors: next.errors + 1, feedback: '这次未落在起音窗口内' }
  }
  if (action.pitch !== next.notes[target]) return { ...next, errors: next.errors + 1, feedback: '音高不匹配 · 继续跟随节拍' }
  if (next.results[target] === 'hit') return next
  const results = [...next.results]
  results[target] = 'hit'
  return { ...next, results, feedback: Math.abs(beat - target) <= 0.12 ? '音高正确 · 起音准确' : `音高正确 · 起音偏${beat < target ? '早' : '晚'}` }
}
