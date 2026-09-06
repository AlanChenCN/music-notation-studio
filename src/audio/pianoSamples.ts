export interface PianoSampleAnchor {
  midiNumber: number
  file: string
}

/**
 * Salamander Grand Piano anchors, sampled roughly every minor third.
 * Nearby pitches are rendered by changing the source playback rate.
 */
export const pianoSampleAnchors: PianoSampleAnchor[] = [
  { midiNumber: 21, file: 'A0.mp3' },
  { midiNumber: 24, file: 'C1.mp3' },
  { midiNumber: 30, file: 'Fs1.mp3' },
  { midiNumber: 33, file: 'A1.mp3' },
  { midiNumber: 36, file: 'C2.mp3' },
  { midiNumber: 42, file: 'Fs2.mp3' },
  { midiNumber: 45, file: 'A2.mp3' },
  { midiNumber: 48, file: 'C3.mp3' },
  { midiNumber: 54, file: 'Fs3.mp3' },
  { midiNumber: 57, file: 'A3.mp3' },
  { midiNumber: 60, file: 'C4.mp3' },
  { midiNumber: 66, file: 'Fs4.mp3' },
  { midiNumber: 69, file: 'A4.mp3' },
  { midiNumber: 72, file: 'C5.mp3' },
  { midiNumber: 78, file: 'Fs5.mp3' },
  { midiNumber: 81, file: 'A5.mp3' },
  { midiNumber: 84, file: 'C6.mp3' },
  { midiNumber: 90, file: 'Fs6.mp3' },
  { midiNumber: 93, file: 'A6.mp3' },
  { midiNumber: 96, file: 'C7.mp3' },
]

export function midiNumberForFrequency(frequency: number) {
  return Math.round(69 + 12 * Math.log2(frequency / 440))
}

export function nearestPianoSample(midiNumber: number) {
  return pianoSampleAnchors.reduce((nearest, sample) =>
    Math.abs(sample.midiNumber - midiNumber) < Math.abs(nearest.midiNumber - midiNumber)
      ? sample
      : nearest,
  )
}

export function pianoSampleUrl(file: string) {
  const baseUrl = typeof window === 'undefined' ? '/' : import.meta.env.BASE_URL
  return `${baseUrl}audio/salamander/${file}`
}
