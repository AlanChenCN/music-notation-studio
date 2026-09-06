import PianoKey from './PianoKey'
import {
  pianoNotes,
  type PianoLabelMode,
} from '../data/piano'
import { pianoLabelFor } from '../music/noteDisplay'

interface PianoProps {
  pressedNotes: string[]
  labelMode: PianoLabelMode
  onPress: (noteName: string) => void
  onRelease: (noteName: string) => void
  hidden?: boolean
}

function Piano({
  pressedNotes,
  labelMode,
  onPress,
  onRelease,
  hidden = false,
}: PianoProps) {
  const whiteKeys = pianoNotes.filter(note => note.type === "white")
  const blackKeys = pianoNotes.filter(note => note.type === "black")

  return (
    <div className="piano-viewport" aria-hidden={hidden}>
      <div className="piano">
        <div className="white-keys">
          {whiteKeys.map(note => (
            <PianoKey
              key={note.name}
              note={note.name}
              displayLabel={pianoLabelFor(note, labelMode)}
              type={note.type}
              position={note.position}
              pressed={pressedNotes.includes(note.name)}
              onPress={() => onPress(note.name)}
              onRelease={() => onRelease(note.name)}
            />
          ))}
        </div>

        <div className="black-keys">
          {blackKeys.map(note => (
            <PianoKey
              key={note.name}
              note={note.name}
              displayLabel={pianoLabelFor(note, labelMode)}
              type={note.type}
              position={note.position}
              pressed={pressedNotes.includes(note.name)}
              onPress={() => onPress(note.name)}
              onRelease={() => onRelease(note.name)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Piano
