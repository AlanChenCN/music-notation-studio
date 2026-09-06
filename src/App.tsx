import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import RandomTrainer from './practice/RandomTrainer'
import FreePlay from './practice/FreePlay'
import ScoreTrainer from './practice/ScoreTrainer'
import { ScorePractice } from './practice/scorePractice'
import type { ScoreDocument } from './score/scoreModel'
import ScoreEditor, { type ScoreEditorHandle } from './score/ScoreEditor'
import Header from './components/Header'
import GlobalControls from './components/GlobalControls'
import InputPianoDock from './components/InputPianoDock'
import type { InputConnectionState } from './components/InputDeviceButton'
import MidiPanel from './components/MidiPanel'
import StatusBar from './components/StatusBar'
import type { ConfigurableThemeToken } from './components/ThemePopover'
import { setAudioEnabled, startNote, stopNote } from './audio/sound'
import {
  midiNumberToPianoNote,
  pianoNoteToMidiNumber,
  pianoNotes,
  type PianoLabelMode,
} from './data/piano'
import {
  InputLayer,
  type InputNoteContext,
} from './input/inputLayer'
import { KeyboardController } from './input/keyboardController'
import { MidiInputController } from './input/midiController'
import { BluetoothMidiController } from './input/bluetoothMidiController'
import {
  defaultKeyboardBaseNote,
  type KeyboardBaseNote,
} from './input/keyboardMapper'
import {
  applyThemeToDocument,
  createThemeSettings,
  getSystemThemePreset,
  resolveThemeDisplayPreset,
  resolveThemeTokens,
  selectThemeMode,
  updateThemeToken,
  type ThemePreset,
  type ThemeMode,
} from './theme/theme'
import { useSettings } from './settings/useSettings'
import './App.css'

function App() {
  const {
    settings,
    updateSettings,
    saveCurrentSettings,
    resetSettings,
  } = useSettings()
  const [workspace, setWorkspace] = useState<'trainer' | 'score'>('score')
  const workspaceRef = useRef<'trainer' | 'score'>('score')
  const [trainerSource, setTrainerSource] = useState<'score' | 'random' | 'free'>('score')
  const trainerSourceRef = useRef<'score' | 'random' | 'free'>('score')
  const scorePractice = useMemo(() => new ScorePractice(), [])
  const randomPractice = useMemo(() => new ScorePractice(), [])
  const editorRef = useRef<ScoreEditorHandle>(null)
  const liveHeld = useRef(new Map<string, string>())
  const freeAudition = useRef<string[]>([])
  const [recentFreeNotes, setRecentFreeNotes] = useState<string[]>([])
  const heldAudition = useRef(new Set<string>())
  const [audition, setAudition] = useState<number[]>([])
  const [playbackNotes, setPlaybackNotes] = useState<string[]>([])
  const [pressedNotes, setPressedNotes] = useState<string[]>([])
  const [keyDockCollapsed, setKeyDockCollapsed] = useState(() => {
    try {
      return (window.localStorage.getItem('music-notation-studio.key-dock-collapsed') ?? window.localStorage.getItem('piano-trainer.key-dock-collapsed')) === 'true'
    } catch {
      return false
    }
  })
  const [midiPanelOpen, setMidiPanelOpen] = useState(false)
  const [midiDeviceName, setMidiDeviceName] = useState<string | null>(null)
  const [midiConnectionState, setMidiConnectionState] =
    useState<InputConnectionState>('disconnected')
  const [bluetoothMidiDeviceName, setBluetoothMidiDeviceName] = useState<
    string | null
  >(null)
  const [bluetoothConnectionState, setBluetoothConnectionState] =
    useState<InputConnectionState>('disconnected')
  const midiButtonRef = useRef<HTMLButtonElement>(null)

  const handleKeyDockCollapsedChange = useCallback((collapsed: boolean) => {
    setKeyDockCollapsed(collapsed)
    try {
      window.localStorage.setItem('music-notation-studio.key-dock-collapsed', String(collapsed))
    } catch {
      // The dock remains usable when local storage is unavailable.
    }
  }, [])
  const [systemThemePreset, setSystemThemePreset] = useState<ThemePreset>(
    getSystemThemePreset,
  )
  const themeSettings = settings.theme
  const labelMode = settings.piano.labelMode
  const soundEnabled = settings.audio.soundEnabled
  const noteDisplayMode = settings.grandStaff.noteDisplayMode
  const themeTokens = useMemo(
    () => resolveThemeTokens(themeSettings, systemThemePreset),
    [systemThemePreset, themeSettings],
  )
  const activeThemePreset = resolveThemeDisplayPreset(
    themeSettings.mode,
    systemThemePreset,
  )

  const [keyboardBaseNote, setKeyboardBaseNote] = useState<KeyboardBaseNote>(
    defaultKeyboardBaseNote,
  )
  const pressNote = useCallback((
    noteName: string,
    context: InputNoteContext = { source: 'mouse' },
  ) => {
    const note = pianoNotes.find(item => item.name === noteName)

    if (!note) {
      return
    }

    if (context.source === 'playback') {
      startNote(`score:${note.name}`, note.frequency)
      setPlaybackNotes(prev => prev.includes(noteName) ? prev : [...prev, noteName])
      return
    }
    if (workspaceRef.current === 'score') {
      heldAudition.current.add(`${context.source}:${noteName}`)
      const pitches = [...heldAudition.current].map(key => pianoNoteToMidiNumber(key.slice(key.indexOf(':') + 1))!)
      setAudition([...new Set(pitches)].sort((a, b) => a - b))
    }
    const key = `${context.source}:${noteName}`
    liveHeld.current.set(key, noteName)
    const liveNames = [...new Set(liveHeld.current.values())]
    if (workspaceRef.current === 'trainer') {
      if (trainerSourceRef.current === 'score') scorePractice.press(key, pianoNoteToMidiNumber(note)!)
      else if (trainerSourceRef.current === 'random') randomPractice.press(key, pianoNoteToMidiNumber(note)!)
      else freeAudition.current = liveNames.sort((a, b) => pianoNoteToMidiNumber(a)! - pianoNoteToMidiNumber(b)!)
    }
    setPressedNotes(liveNames)

    startNote(`${context.source}:${note.name}`, note.frequency, context.velocity)
  }, [randomPractice, scorePractice])

  const releaseNote = useCallback((
    noteName: string,
    context: InputNoteContext = { source: 'mouse' },
  ) => {
    if (context.source === 'playback') {
      stopNote(`score:${noteName}`)
      setPlaybackNotes(prev => prev.filter(name => name !== noteName))
      return
    }
    const key = `${context.source}:${noteName}`
    scorePractice.release(key)
    randomPractice.release(key)
    heldAudition.current.delete(key)
    const released = liveHeld.current.delete(key)
    if (released && !liveHeld.current.size && workspaceRef.current === 'trainer' && trainerSourceRef.current === 'free') setRecentFreeNotes([...freeAudition.current])
    setPressedNotes([...new Set(liveHeld.current.values())])
    stopNote(`${context.source}:${noteName}`)
  }, [randomPractice, scorePractice])

  const inputLayer = useMemo(
    // InputLayer only stores callbacks; it never invokes them during construction.
    // eslint-disable-next-line react-hooks/refs
    () => new InputLayer({ pressNote, releaseNote }),
    [pressNote, releaseNote],
  )

  const playScoreNote = useCallback((pitch: number) => {
    const note = midiNumberToPianoNote(pitch)
    if (note) inputLayer.pressNote(note.name, { source: 'playback' })
  }, [inputLayer])
  const stopScoreNote = useCallback((pitch: number) => {
    const note = midiNumberToPianoNote(pitch)
    if (note) inputLayer.releaseNote(note.name, { source: 'playback' })
  }, [inputLayer])
  const keyboardController = useMemo(
    () => new KeyboardController(inputLayer, defaultKeyboardBaseNote),
    [inputLayer],
  )

  const midiInputController = useMemo(
    () => new MidiInputController(inputLayer),
    [inputLayer],
  )

  const bluetoothMidiController = useMemo(
    () => new BluetoothMidiController(inputLayer),
    [inputLayer],
  )

  function handleSoundChange(enabled: boolean) {
    updateSettings(current => ({
      ...current,
      audio: {
        ...current.audio,
        soundEnabled: enabled,
      },
    }))
    setAudioEnabled(enabled)
  }

  const handleLabelModeChange = useCallback((mode: PianoLabelMode) => {
    updateSettings(current => ({
      ...current,
      piano: {
        ...current.piano,
        labelMode: mode,
      },
    }))
  }, [updateSettings])

  const pressMouseNote = useCallback(
    (noteName: string) => inputLayer.pressNote(noteName, { source: 'mouse' }),
    [inputLayer],
  )

  const releaseMouseNote = useCallback(
    (noteName: string) => inputLayer.releaseNote(noteName, { source: 'mouse' }),
    [inputLayer],
  )

  const handleThemeModeChange = useCallback(
    (mode: ThemeMode) => {
      updateSettings(current => ({
        ...current,
        theme: selectThemeMode(current.theme, mode, systemThemePreset),
      }))
    },
    [systemThemePreset, updateSettings],
  )

  const handleThemeTokenChange = useCallback(
    (token: ConfigurableThemeToken, value: string) => {
      updateSettings(current => ({
        ...current,
        theme: updateThemeToken(current.theme, token, value, systemThemePreset),
      }))
    },
    [systemThemePreset, updateSettings],
  )

  const handleNoteColorModeChange = useCallback(
    (mode: 'single' | 'left-right') => {
      updateSettings(current => ({
        ...current,
        theme: {
          ...current.theme,
          noteColorMode: mode,
        },
      }))
    },
    [updateSettings],
  )

  const handleThemeReset = useCallback(() => {
    updateSettings(current => ({
      ...current,
      theme: createThemeSettings(systemThemePreset),
    }))
  }, [systemThemePreset, updateSettings])

  const handleNoteDisplayModeChange = useCallback((mode: typeof noteDisplayMode) => {
    updateSettings(current => ({
      ...current,
      grandStaff: {
        ...current.grandStaff,
        noteDisplayMode: mode,
      },
    }))
  }, [updateSettings])

  const handleAutoSaveChange = useCallback(
    (enabled: boolean) => {
      updateSettings(current => ({ ...current, autoSave: enabled }))
    },
    [updateSettings],
  )

  useEffect(() => {
    setAudioEnabled(settings.audio.soundEnabled)
  }, [settings.audio.soundEnabled])

  const handleResetSettings = useCallback(() => {
    resetSettings()
  }, [resetSettings])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      setSystemThemePreset(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [])

  useEffect(() => {
    applyThemeToDocument(themeTokens)
  }, [themeTokens])

  useEffect(() => {
    keyboardController.start()

    return () => {
      keyboardController.stop()
    }
  }, [keyboardController])

  useEffect(() => {
    keyboardController.setBaseNote(keyboardBaseNote)
  }, [keyboardController, keyboardBaseNote])

  useEffect(() => {
    return () => {
      midiInputController.reset()
      void bluetoothMidiController.disconnect()
      scorePractice.pause()
      randomPractice.pause()
    }
  }, [
    bluetoothMidiController,
    midiInputController,
    scorePractice,
    randomPractice,
  ])

  const handleMidiConnectionChange = useCallback(
    (deviceName: string | null) => {
      if (!deviceName) {
        midiInputController.reset()
      }

      setMidiDeviceName(deviceName)
    },
    [midiInputController],
  )

  const handleBluetoothConnectionChange = useCallback(
    (deviceName: string | null) => {
      setBluetoothMidiDeviceName(deviceName)
      setBluetoothConnectionState(
        deviceName ? 'connected' : 'disconnected',
      )
    },
    [],
  )

  const handleBluetoothConnect = useCallback(
    () => bluetoothMidiController.connect(handleBluetoothConnectionChange),
    [bluetoothMidiController, handleBluetoothConnectionChange],
  )

  const handleBluetoothDisconnect = useCallback(
    () => bluetoothMidiController.disconnect(),
    [bluetoothMidiController],
  )

  const handleWorkspaceChange = useCallback((nextWorkspace: 'trainer' | 'score') => {
    scorePractice.pause()
    randomPractice.pause()
    workspaceRef.current = nextWorkspace
    heldAudition.current.clear()
    setWorkspace(nextWorkspace)
  }, [scorePractice, randomPractice])

  const practiceScore = useCallback((score: ScoreDocument) => {
    scorePractice.load(score)
    trainerSourceRef.current = 'score'; setTrainerSource('score')
    handleWorkspaceChange('trainer')
  }, [scorePractice, handleWorkspaceChange])

  return (
    <div className={`music-notation-studio music-notation-studio--score${keyDockCollapsed ? ' music-notation-studio--key-dock-collapsed' : ''}`}>
      <Header
        workspace={workspace}
        disabled={pressedNotes.length > 0}
        onWorkspaceChange={handleWorkspaceChange}
        controls={<GlobalControls themeMode={themeSettings.mode} activePreset={activeThemePreset} themeTokens={themeTokens} noteColorMode={themeSettings.noteColorMode} settings={settings} onThemeModeChange={handleThemeModeChange} onThemeTokenChange={handleThemeTokenChange} onNoteColorModeChange={handleNoteColorModeChange} onThemeReset={handleThemeReset} onAutoSaveChange={handleAutoSaveChange} onSoundChange={handleSoundChange} onLabelModeChange={handleLabelModeChange} onSaveSettings={saveCurrentSettings} onResetSettings={handleResetSettings} />}
      />
      <main className="main-content">
        <div className="trainer-panel" id="trainer-panel" role="tabpanel" aria-labelledby="trainer-tab" hidden={workspace !== 'trainer'}>
        <div className="score-editor trainer-source" aria-label="练习来源">
          {([['score', '乐谱跟练'], ['random', '随机练习'], ['free', '自由弹奏']] as const).map(([source, label]) => <button key={source} disabled={pressedNotes.length > 0} aria-pressed={trainerSource === source} onClick={() => { scorePractice.pause(); randomPractice.pause(); trainerSourceRef.current = source; setTrainerSource(source) }}>{label}</button>)}
        </div>
        <ScoreTrainer controller={scorePractice} active={workspace === 'trainer' && trainerSource === 'score'} inputHeld={pressedNotes.length > 0} onPlayNote={playScoreNote} onStopNote={stopScoreNote} />
        <RandomTrainer controller={randomPractice} active={workspace === 'trainer' && trainerSource === 'random'} inputHeld={pressedNotes.length > 0} onPlayNote={playScoreNote} onStopNote={stopScoreNote} onSendToEditor={score => { if (editorRef.current?.openScore(score)) handleWorkspaceChange('score') }} />
        <FreePlay active={workspace === 'trainer' && trainerSource === 'free'} pressedNotes={pressedNotes} recentNotes={recentFreeNotes} onClear={() => { freeAudition.current = []; setRecentFreeNotes([]) }} display={noteDisplayMode} onDisplayChange={handleNoteDisplayModeChange} />
        </div>
        <ScoreEditor ref={editorRef} onPractice={practiceScore} inputHeld={pressedNotes.length > 0} active={workspace === 'score'} audition={audition} onPlayNote={playScoreNote} onStopNote={stopScoreNote} />
        <div className="trainer-status" hidden={workspace !== 'trainer'}><StatusBar keyboardBaseNote={keyboardBaseNote} midiDeviceName={midiDeviceName} bluetoothMidiDeviceName={bluetoothMidiDeviceName} /></div>
        <div className="score-status" hidden={workspace !== 'score'}><StatusBar keyboardBaseNote={keyboardBaseNote} midiDeviceName={midiDeviceName} bluetoothMidiDeviceName={bluetoothMidiDeviceName} /></div>
      </main>

      <InputPianoDock
        pressedNotes={[...new Set([...pressedNotes, ...playbackNotes])]}
        labelMode={labelMode}
        onLabelModeChange={handleLabelModeChange}
        soundEnabled={soundEnabled}
        onSoundChange={handleSoundChange}
        onPress={pressMouseNote}
        onRelease={releaseMouseNote}
        keyboardBaseNote={keyboardBaseNote}
        onKeyboardBaseNoteChange={setKeyboardBaseNote}
        midiButtonRef={midiButtonRef}
        midiConnectionState={midiConnectionState}
        onMidiConnect={() => setMidiPanelOpen(true)}
        bluetoothConnectionState={bluetoothConnectionState}
        keyDockCollapsed={keyDockCollapsed}
        onKeyDockCollapsedChange={handleKeyDockCollapsedChange}
      />

      <MidiPanel
        isOpen={midiPanelOpen}
        onClose={() => setMidiPanelOpen(false)}
        anchorRef={midiButtonRef}
        onConnectionChange={handleMidiConnectionChange}
        onConnectionStateChange={setMidiConnectionState}
        onMidiMessage={midiInputController.handleMessage}
        onConnect={handleBluetoothConnect}
        onDisconnect={handleBluetoothDisconnect}
        connectedDeviceName={bluetoothMidiDeviceName}
        onBluetoothConnectionStateChange={setBluetoothConnectionState}
      />
    </div>
  )
}

export default App
