import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Bluetooth, ChevronRight, CircleCheck, Heart, Home, KeyboardMusic, Music2, Pause, Piano, Play, RotateCcw, Settings2, SlidersHorizontal, Smartphone, Sparkles, Star, Trophy, Unplug, X, Zap } from 'lucide-react'
import Modal from './components/Modal'
import Staff from './components/Staff'
import { MidiConnection, type MidiNote, type MidiState } from './midi'
import { createSession, defaultConfig, generateNotes, noteName, sessionBeat, sessionReducer, type Mode, type PracticeConfig } from './practice'

type Panel = 'midi' | 'settings' | 'practice' | null
type Theme = 'system' | 'light' | 'dark'
const configKey = 'mns.practice.v1'
const themeKey = 'mns.theme.v1'
function loadConfig(): PracticeConfig {
  try {
    const value = JSON.parse(localStorage.getItem(configKey) || 'null')
    if (value && ['treble', 'bass'].includes(value.clef) && Number.isInteger(value.low) && Number.isInteger(value.high) && value.low >= 36 && value.high <= 84 && value.low <= value.high && value.high - value.low <= 24 && ['white', 'all'].includes(value.pool) && [8, 16, 32].includes(value.length) && Number.isInteger(value.bpm) && value.bpm >= 40 && value.bpm <= 180 && typeof value.labels === 'boolean') return value
  } catch { /* Use defaults when browser storage is unavailable or invalid. */ }
  return defaultConfig
}
function initialState() { const config = loadConfig(); return createSession('reading', config, generateNotes(config)) }
const keyboardNotes: Record<string, number> = { a: 60, s: 62, d: 64, f: 65, g: 67, h: 69, j: 71, k: 72, w: 61, e: 63, t: 66, y: 68, u: 70 }

export default function App() {
  const [session, dispatch] = useReducer(sessionReducer, undefined, initialState)
  const [page, setPage] = useState<'home' | 'practice'>('home')
  const [panel, setPanel] = useState<Panel>(null)
  const [draft, setDraft] = useState<PracticeConfig>(session.config)
  const [formError, setFormError] = useState('')
  const [storageError, setStorageError] = useState('')
  const [midi, setMidi] = useState<MidiState>({ connected: false, name: '', error: '', busy: false, path: null })
  const [lastInput, setLastInput] = useState<number | null>(null)
  const [touchInput, setTouchInput] = useState(false)
  const [theme, setTheme] = useState<Theme>(() => { try { const value = localStorage.getItem(themeKey); return value === 'light' || value === 'dark' ? value : 'system' } catch { return 'system' } })
  const pause = useCallback(() => dispatch({ type: 'pause', now: performance.now() }), [])
  const receiveMidi = useCallback((note: MidiNote) => {
    if (note.down) setLastInput(note.pitch)
    dispatch({ type: 'input', ...note, now: performance.now() })
  }, [])
  const releaseMidi = useCallback(() => { dispatch({ type: 'release-source', source: 'midi', now: performance.now() }); pause() }, [pause])
  const connection = useMemo(() => new MidiConnection(receiveMidi, setMidi, releaseMidi), [receiveMidi, releaseMidi])
  useEffect(() => () => connection.disconnect(), [connection])
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => {
    if (session.status !== 'running' || session.mode !== 'rhythm') return
    let frame = 0
    const update = () => { dispatch({ type: 'tick', now: performance.now() }); frame = requestAnimationFrame(update) }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [session.status, session.mode])
  useEffect(() => {
    const releaseKeyboard = () => dispatch({ type: 'release-source', source: 'keyboard', now: performance.now() })
    const suspend = () => { pause(); releaseKeyboard(); dispatch({ type: 'release-source', source: 'touch', now: performance.now() }) }
    const visibility = () => { if (document.hidden) suspend() }
    const orientation = matchMedia('(orientation: portrait)')
    const rotate = () => { if (orientation.matches) { suspend(); setPanel(null) } }
    window.addEventListener('blur', suspend)
    document.addEventListener('visibilitychange', visibility)
    orientation.addEventListener('change', rotate)
    return () => { window.removeEventListener('blur', suspend); document.removeEventListener('visibilitychange', visibility); orientation.removeEventListener('change', rotate) }
  }, [pause])
  useEffect(() => {
    const input = (event: KeyboardEvent) => {
      const pitch = keyboardNotes[event.key.toLowerCase()]
      if (pitch === undefined || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
      const down = event.type === 'keydown'
      if (down && (page !== 'practice' || panel || (event.target as HTMLElement).closest('input,select,textarea'))) return
      event.preventDefault()
      if (down) setLastInput(pitch)
      dispatch({ type: 'input', key: `keyboard:${event.code}`, pitch, down, now: performance.now() })
    }
    window.addEventListener('keydown', input)
    window.addEventListener('keyup', input)
    return () => { window.removeEventListener('keydown', input); window.removeEventListener('keyup', input) }
  }, [page, panel])
  const openPanel = (next: Panel) => { pause(); setDraft({ ...session.config }); setFormError(''); setPanel(next) }
  const enter = (mode: Mode) => {
    if (session.mode !== mode) dispatch({ type: 'reset', session: createSession(mode, session.config, generateNotes(session.config)) })
    setPage('practice')
  }
  const goHome = () => { pause(); setPage('home') }
  const restart = (newNotes: boolean) => dispatch({ type: 'reset', session: createSession(session.mode, session.config, newNotes ? generateNotes(session.config) : session.notes) })
  const applyConfig = () => {
    if (draft.low > draft.high || draft.high - draft.low > 24) { setFormError('最低音不能高于最高音，音域跨度最多两个八度。'); return }
    if (!Number.isInteger(draft.bpm) || draft.bpm < 40 || draft.bpm > 180) { setFormError('请输入 40–180 之间的整数 BPM。'); return }
    try {
      const notes = generateNotes(draft)
      dispatch({ type: 'reset', session: createSession(session.mode, draft, notes) })
      setStorageError('')
      try { localStorage.setItem(configKey, JSON.stringify(draft)) } catch { setStorageError('浏览器无法保存设置，本次修改仍然有效。') }
      setPanel(null)
    } catch (error) { setFormError(error instanceof Error ? error.message : '无法生成练习') }
  }
  const setAppearance = (value: Theme) => { setTheme(value); try { localStorage.setItem(themeKey, value); setStorageError('') } catch { setStorageError('浏览器无法保存外观设置。') } }
  const toggleLabels = () => {
    const labels = !session.config.labels
    dispatch({ type: 'labels', visible: labels })
    try { localStorage.setItem(configKey, JSON.stringify({ ...session.config, labels })); setStorageError('') } catch { setStorageError('浏览器无法保存音名设置，本次修改仍然有效。') }
  }
  const hits = session.results.filter(result => result === 'hit').length
  const missed = session.results.filter(result => result === 'miss').length
  const running = session.status === 'running'
  const completed = session.status === 'complete'
  const heldCount = Object.keys(session.held).length
  const name = session.mode === 'reading' ? '识谱练习' : '节拍跟弹'
  const beat = sessionBeat(session)
  const progress = Math.round(session.results.filter(result => result !== 'pending').length / session.notes.length * 100)
  const feedbackTone = completed ? 'complete' : /正确|很好/.test(session.feedback) ? 'success' : /再试|不匹配|未落/.test(session.feedback) ? 'retry' : 'neutral'
  const touchPitches = useMemo(() => Array.from(new Set(Array.from({ length: session.config.high - session.config.low + 1 }, (_, i) => i + session.config.low))).filter(pitch => session.config.pool === 'all' || ![1, 3, 6, 8, 10].includes(pitch % 12)), [session.config])
  return <>
    <div className="app-shell">
      <header className="app-header">
        <button className="brand" onClick={goHome} aria-label="返回主页"><span className="brand-mark"><Piano /></span><span>Music Notation Studio<small>让每一次弹奏，都有小进步</small></span></button>
        <div className="header-actions"><button className="button connection-button" onClick={() => openPanel('midi')}><span className={`status-dot ${midi.connected ? 'connected' : ''}`} /><span>MIDI<span className="connection-detail"> · {midi.connected ? '已连接' : '未连接'}</span></span></button><button className="icon-button" aria-label="通用设置" onClick={() => openPanel('settings')}><Settings2 /></button></div>
      </header>
      {page === 'home' ? <main className="home-page">
        <div className="home-hero"><div className="home-intro"><span className="eyebrow"><Sparkles />快乐练琴，现在开始</span><h1>从一个<span className="headline-accent">音符</span>开始。</h1><p>把今天的练习，变成一场小冒险。</p></div><div className="hero-art" aria-hidden="true"><span className="art-spark spark-one"><Sparkles /></span><span className="art-note"><Music2 /></span><div className="note-buddy"><Music2 /><span className="buddy-eyes"><i /><i /></span><span className="buddy-smile" /></div><span className="art-spark spark-two"><Star /></span><div className="mini-piano">{Array.from({ length: 7 }, (_, i) => <i key={i} />)}</div></div></div>
        <div className="mode-grid">
          <button className="mode-card reading-card" onClick={() => enter('reading')}><span className="mode-top"><span className="mode-emblem"><Music2 /></span><span className="mode-tag">自由速度</span></span><div className="mode-copy"><h2>识谱练习</h2><p>不赶时间，弹对一个，再来一个。</p></div><span className="mode-bottom"><span>{session.mode === 'reading' && session.status === 'paused' ? '继续练习' : '开启识谱冒险'}<ArrowRight /></span><span className="card-decoration" aria-hidden="true"><Star /><Star /><Star /></span></span></button>
          <button className="mode-card rhythm-card" onClick={() => enter('rhythm')}><span className="mode-top"><span className="mode-emblem"><Zap /></span><span className="mode-tag">跟随节拍</span></span><div className="mode-copy"><h2>节拍跟弹</h2><p>找到节奏，让音符跟你一起跳动。</p></div><span className="mode-bottom"><span>{session.mode === 'rhythm' && session.status === 'paused' ? '继续练习' : '出发，节拍挑战'}<ArrowRight /></span><span className="card-decoration rhythm-decoration" aria-hidden="true"><i /><i /><i /><i /><i /></span></span></button>
        </div>
        <footer className="home-footer"><button className="text-button" onClick={() => openPanel('midi')}><span className={`status-dot ${midi.connected ? 'connected' : ''}`} />{midi.connected ? midi.name : '连接电钢琴，准备出发'}<ChevronRight /></button><span><Heart /> 每一个音符，都算数</span></footer>
      </main> : <main className="practice-page">
        <div className="practice-heading"><div><button className="icon-button" onClick={goHome} aria-label="返回主页"><ArrowLeft /></button><span className={`practice-mode-icon ${session.mode}`} aria-hidden="true">{session.mode === 'reading' ? <Music2 /> : <Zap />}</span><h1>{name}</h1></div><button className="button quiet" onClick={() => openPanel('practice')}><SlidersHorizontal /><span>练习配置</span></button></div>
        <section className="score-surface" aria-label="练习谱面">
          <div className="score-meta"><span>{session.config.clef === 'treble' ? '高' : '低'}音谱表 · {noteName(session.config.low)}–{noteName(session.config.high)} · 4/4</span><div className="score-display-controls"><span className="pace-label">{session.mode === 'reading' ? '自由速度' : `${session.config.bpm} BPM`}</span><label className="note-name-toggle"><input type="checkbox" checked={session.config.labels} onChange={toggleLabels} /><span>音名</span></label></div></div>
          <Staff session={session} />
          <div className={`score-feedback ${completed ? 'finished' : ''}`} data-tone={feedbackTone} aria-live="polite">{completed ? <><Trophy /> 本轮完成 · 命中 {hits}/{session.notes.length}{session.mode === 'rhythm' ? ` · 漏音 ${missed}` : ` · 错误尝试 ${session.errors}`}<button className="text-button" onClick={() => restart(true)}>新一轮<ArrowUpRight /></button></> : <span className="feedback-message" key={session.feedback}>{feedbackTone === 'success' ? <CircleCheck /> : feedbackTone === 'retry' ? <Heart /> : <Sparkles />}{session.feedback}</span>}</div>
        </section>
        {touchInput && <div className="touch-keyboard" aria-label="触控试弹键盘">{touchPitches.map(pitch => <button key={pitch} className={`touch-key ${Object.values(session.held).includes(pitch) ? 'pressed' : ''}`} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); setLastInput(pitch); dispatch({ type: 'input', key: `touch:${event.pointerId}`, pitch, down: true, now: performance.now() }) }} onPointerUp={event => dispatch({ type: 'input', key: `touch:${event.pointerId}`, pitch, down: false, now: performance.now() })} onPointerCancel={event => dispatch({ type: 'input', key: `touch:${event.pointerId}`, pitch, down: false, now: performance.now() })} onLostPointerCapture={event => dispatch({ type: 'input', key: `touch:${event.pointerId}`, pitch, down: false, now: performance.now() })}>{noteName(pitch)}</button>)}</div>}
        <footer className="transport"><div className="practice-progress"><div className="progress-summary"><Star aria-hidden="true" /><span>{completed ? '本轮完成' : running && session.mode === 'rhythm' && beat < 0 ? '四拍预备' : `第 ${session.index + 1} / ${session.notes.length} 音`}</span></div><div className="round-progress" role="progressbar" aria-label="本轮进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div style={{ width: `${progress}%` }} /></div><small>{hits} 命中{session.mode === 'rhythm' ? ` · ${missed} 漏音` : ` · ${session.errors} 错误尝试`}</small></div><div className="transport-actions"><button className="icon-button" onClick={() => restart(false)} aria-label="重练当前短谱"><RotateCcw /></button><button className="button primary play-button" disabled={!running && !completed && heldCount > 0} onClick={() => completed ? restart(true) : running ? pause() : dispatch({ type: 'start', now: performance.now() })}>{running ? <Pause /> : completed ? <RotateCcw /> : <Play />}<span>{completed ? '新一轮' : running ? '暂停' : session.status === 'paused' ? '继续练习' : '开始练习'}</span></button></div><button className={`button quiet input-toggle ${touchInput ? 'selected' : ''}`} onClick={() => { dispatch({ type: 'release-source', source: 'touch', now: performance.now() }); setTouchInput(!touchInput) }} aria-label="触控试弹" aria-pressed={touchInput}><KeyboardMusic /><span>触控试弹</span></button></footer>
        {heldCount > 0 && !running && <div className="release-notice" role="status">请先松开全部琴键</div>}
      </main>}
    </div>
    <div className="orientation-guard"><Smartphone /><h1>请横屏使用</h1><p>转动设备，展开你的钢琴练习空间。</p></div>
    {panel && <Modal title={panel === 'midi' ? 'MIDI 连接' : panel === 'settings' ? '通用设置' : '练习配置'} onClose={() => setPanel(null)} footer={panel === 'practice' ? <><button className="button" onClick={() => setPanel(null)}>取消</button><button className="button primary" onClick={applyConfig}>应用并生成新题</button></> : undefined}>
      {panel === 'midi' ? <>
        <div className="connection-summary"><span className={`status-dot ${midi.connected ? 'connected' : ''}`} /><div><strong>{midi.connected ? midi.name : '尚未连接电钢琴'}</strong><p>{midi.connected ? '试弹一个音，确认输入正常。' : '打开电钢琴蓝牙 MIDI，并允许 Beacio 访问此网站。'}</p></div></div>
        {!window.isSecureContext && <p className="error" role="alert">当前不是安全连接。设备 MIDI 访问需要 HTTPS 或 localhost。</p>}
        <button className="connection-option" disabled={midi.busy} onClick={() => void connection.connectBluetooth()}><Bluetooth /><div><strong>{midi.busy && midi.path === 'bluetooth' ? '正在连接…' : '连接蓝牙 MIDI'}</strong><small>Safari + Beacio 蓝牙接口</small></div><ChevronRight /></button>
        <button className="connection-option" disabled={midi.busy} onClick={() => void connection.connectWebMidi()}><Piano /><div><strong>{midi.busy && midi.path === 'webmidi' ? '正在连接…' : '使用系统 MIDI'}</strong><small>设备由系统或插件提供 MIDI 接口时使用</small></div><ChevronRight /></button>
        {midi.error && <p className="error" role="alert">{midi.error}</p>}
        <div className="input-monitor"><span>最近收到的音符</span><strong aria-live="polite">{lastInput === null ? '等待输入' : noteName(lastInput)}</strong></div>
        {(midi.connected || midi.busy) && <button className="button" onClick={() => connection.disconnect()}><Unplug />{midi.busy ? '取消连接' : '断开连接'}</button>}
        <p className="help">切换页面不会主动断开连接。连接中断时练习暂停。蓝牙适配需在你的 Beacio 与电钢琴上实测。</p>
      </> : panel === 'settings' ? <>
        <label className="setting-row"><span>外观</span><select value={theme} onChange={event => setAppearance(event.target.value as Theme)}><option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option></select></label>
        <div className="setting-info"><KeyboardMusic /><div><strong>电脑键盘试弹</strong><p>A S D F G H J K 对应 C4–C5 白键；W E T Y U 对应黑键。仅在练习页且弹窗关闭时生效。</p></div></div>
        <div className="setting-info"><Home /><div><strong>练习状态</strong><p>返回主页或打开卡片会暂停。刷新页面后重新开始，练习配置与外观保存在本机。</p></div></div>
        <p className="help">本版不提供网页钢琴音色，由电钢琴本身发声。节拍跟弹提供视觉预备与播放轴，尚无节拍器声音。</p>
        {storageError && <p className="error" role="alert">{storageError}</p>}
      </> : <>
        <p className="help">应用配置会生成新短谱并清空本轮成绩；关闭或取消保留原练习。</p>
        <label className="setting-row"><span>谱表</span><select value={draft.clef} onChange={event => { const clef = event.target.value as PracticeConfig['clef']; setDraft({ ...draft, clef, low: clef === 'bass' ? 48 : 60, high: clef === 'bass' ? 60 : 72 }) }}><option value="treble">高音谱表</option><option value="bass">低音谱表</option></select></label>
        <label className="setting-row"><span>最低音</span><select value={draft.low} onChange={event => setDraft({ ...draft, low: Number(event.target.value) })}>{Array.from({ length: 49 }, (_, i) => i + 36).map(pitch => <option key={pitch} value={pitch}>{noteName(pitch)}</option>)}</select></label>
        <label className="setting-row"><span>最高音</span><select value={draft.high} onChange={event => setDraft({ ...draft, high: Number(event.target.value) })}>{Array.from({ length: 49 }, (_, i) => i + 36).map(pitch => <option key={pitch} value={pitch}>{noteName(pitch)}</option>)}</select></label>
        <label className="setting-row"><span>音符范围</span><select value={draft.pool} onChange={event => setDraft({ ...draft, pool: event.target.value as PracticeConfig['pool'] })}><option value="white">白键</option><option value="all">全部音</option></select></label>
        <label className="setting-row"><span>练习长度</span><select value={draft.length} onChange={event => setDraft({ ...draft, length: Number(event.target.value) })}>{[8, 16, 32].map(n => <option key={n} value={n}>{n} 音</option>)}</select></label>
        <label className="setting-row"><span>速度 BPM</span><input type="number" min="40" max="180" inputMode="numeric" value={Number.isNaN(draft.bpm) ? '' : draft.bpm} onChange={event => setDraft({ ...draft, bpm: event.target.valueAsNumber })} /></label>
        <label className="setting-row"><span>音名提示</span><input type="checkbox" checked={draft.labels} onChange={event => setDraft({ ...draft, labels: event.target.checked })} /></label>
        {formError && <p className="error" role="alert">{formError}</p>}
        <p className="help">当前每音一拍。跟弹起音窗口为目标前后各 0.3 拍，不评价持音时长；四拍预备期间不计分。</p>
      </>}
    </Modal>}
    {storageError && !panel && <button className="storage-notice" onClick={() => setStorageError('')} aria-label="关闭存储提示">{storageError}<X /></button>}
  </>
}
