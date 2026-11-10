import { type Score, type ScoreEvent, type Duration, midiToPitch } from './score'

const sound = (id: string, start: number, denominator: Duration['denominator'], midi: number[], dotted = false): ScoreEvent => ({
  id, start, duration: { denominator, dotted }, kind: 'notes', notes: midi.map((pitch, i) => ({ id: `${id}-n${i}`, pitch: midiToPitch(pitch) })),
})
const rest = (id: string, start: number, denominator: Duration['denominator']): ScoreEvent => ({ id, start, duration: { denominator }, kind: 'rest' })

// Two voices, two 4/4 bars: different rhythms, partial-chord tie across a barline.
export const foundationScore: Score = {
  version: 1, title: '双声部基础验证谱例', meter: { numerator: 4, denominator: 4 }, tempo: { quarterBpm: 80 }, keySignature: 0, measures: 2,
  voices: [
    { id: 'melody', clef: 'treble', suggestedHand: 'right', events: [
      sound('a1', 0, 8, [60]), sound('a2', 4, 8, [62]), sound('a3', 8, 4, [64]), rest('a4', 16, 4),
      { ...sound('a5', 24, 4, [67, 71]), kind: 'notes', notes: [{ id: 'a5-g', pitch: midiToPitch(67), tieTo: 'a6-n0' }, { id: 'a5-b', pitch: midiToPitch(71) }] },
      sound('a6', 32, 2, [67, 72]), sound('a7', 48, 4, [69], true), sound('a8', 60, 16, [67]), sound('a9', 62, 16, [65]),
    ] },
    { id: 'accompaniment', clef: 'bass', suggestedHand: 'left', events: [sound('b1', 0, 1, [48, 52, 55]), sound('b2', 32, 2, [48]), rest('b3', 48, 2)] },
  ],
}

export const compoundScore: Score = {
  version: 1, title: '6/8 附点与休止', meter: { numerator: 6, denominator: 8 }, tempo: { quarterBpm: 90 }, keySignature: -1, measures: 1,
  voices: [{ id: 'compound', clef: 'treble', events: [
    sound('c1', 0, 4, [65], true), rest('c2', 12, 8), sound('c3', 16, 16, [69], true), sound('c4', 19, 16, [70], true), sound('c5', 22, 16, [72]),
  ] }],
}
// Preserve a flat spelling rather than the MIDI adapter's default sharp spelling.
if (compoundScore.voices[0].events[3].kind === 'notes') compoundScore.voices[0].events[3].notes[0].pitch = { step: 'B', octave: 4, alter: -1 }
export const simpleMeterScores: Score[] = ([2, 3] as const).map(numerator => ({
  version: 1, title: `${numerator}/4 验证谱例`, meter: { numerator, denominator: 4 },
  tempo: { quarterBpm: 80 }, keySignature: 1, measures: 1,
  voices: [{ id: 'simple', clef: 'treble', events: Array.from({ length: numerator }, (_, i) => sound(`s${i}`, i * 8, 4, [66 + i])) }],
}))
export const accidentalScore: Score = {
  version: 1, title: '临时记号与密集和弦', meter: { numerator: 2, denominator: 4 }, tempo: { quarterBpm: 80 }, keySignature: 0, measures: 2,
  voices: [{ id: 'accidentals', clef: 'treble', events: [
    sound('d1', 0, 8, [61]), sound('d2', 4, 8, [61]), sound('d3', 8, 4, [60]),
    sound('d4', 16, 4, [61]), sound('d5', 24, 4, [76, 77, 84]),
  ] }],
}
export const restScore: Score = {
  version: 1, title: '休止符时值', meter: { numerator: 4, denominator: 4 }, tempo: { quarterBpm: 80 }, keySignature: 0, measures: 2,
  voices: [{ id: 'rests', clef: 'bass', events: [rest('r1', 0, 1), rest('r2', 32, 2), rest('r3', 48, 4), rest('r4', 56, 8), rest('r5', 60, 16), rest('r6', 62, 16)] }],
}
export const middleCScore: Score = {
  version: 1, title: '中央 C 共享位置', meter: { numerator: 4, denominator: 4 }, tempo: { quarterBpm: 80 }, keySignature: 0, measures: 1,
  voices: [
    { id: 'upper-c', clef: 'treble', events: [sound('mc1', 0, 2, [60]), sound('mc2', 16, 4, [64]), sound('mc3', 24, 4, [65])] },
    { id: 'lower-c', clef: 'bass', events: [sound('mc4', 0, 4, [60]), sound('mc5', 8, 4, [59]), sound('mc6', 16, 2, [57])] },
  ],
}
/** Same pitch throughout: compare duration spacing without melodic distractions. */
export const durationScore: Score = {
  version: 1, title: '时值与宽度对照', meter: { numerator: 4, denominator: 4 }, tempo: { quarterBpm: 72 }, keySignature: 0, measures: 7,
  voices: [{ id: 'durations', clef: 'treble', events: [
    ...([1, 2, 4, 8, 16] as const).flatMap((denominator, bar) => Array.from({ length: denominator }, (_, i) => sound(`duration-${bar}-${i}`, bar * 32 + i * (32 / denominator), denominator, [67]))),
    sound('dotted-half', 160, 2, [67], true), sound('after-dotted-half', 184, 4, [67]),
    sound('dotted-quarter', 192, 4, [67], true), sound('after-dotted-quarter', 204, 8, [67]),
    sound('dotted-eighth', 208, 8, [67], true), sound('after-dotted-eighth', 214, 16, [67]), sound('duration-end', 216, 4, [67]),
  ] }],
}
export const scoreExamples = [foundationScore, compoundScore, ...simpleMeterScores, accidentalScore, restScore, middleCScore, durationScore]


// Traditional melody, arranged as a short beginner exercise.
const brothers = [[60, 62, 64, 60], [60, 62, 64, 60], [64, 65, 67], [64, 65, 67], [67, 69, 67, 65, 64, 60], [67, 69, 67, 65, 64, 60], [60, 55, 60], [60, 55, 60]]
export const songScores: Score[] = [{
  version: 1, title: '两只老虎', meter: { numerator: 4, denominator: 4 }, tempo: { quarterBpm: 72 }, keySignature: 0, measures: brothers.length,
  voices: [{ id: 'melody', clef: 'treble', events: brothers.flatMap((bar, i) => bar.map((pitch, j) => sound(
    `song-${i}-${j}`, i * 32 + (bar.length === 6 ? (j < 4 ? j * 4 : 16 + (j - 4) * 8) : j * 8),
    bar.length === 6 && j < 4 ? 8 : bar.length === 3 && j === 2 ? 2 : 4, [pitch],
  ))) }],
}]

type DrillBeat = [Duration['denominator'], number[]?]

function drillScore(title: string, bpm: number, upper: DrillBeat[][], lower?: DrillBeat[][]): Score {
  const voice = (id: string, clef: 'treble' | 'bass', bars: DrillBeat[][]) => ({
    id, clef,
    events: bars.flatMap((bar, i) => {
      let tick = i * 32
      return bar.map(([denominator, pitches], j) => {
        const eventId = `${id}-${i}-${j}`
        const event = pitches ? sound(eventId, tick, denominator, pitches) : rest(eventId, tick, denominator)
        tick += 32 / denominator
        return event
      })
    }),
  })
  return {
    version: 1, title, meter: { numerator: 4, denominator: 4 }, tempo: { quarterBpm: bpm }, keySignature: 0,
    measures: upper.length, voices: [voice('upper', 'treble', upper), ...(lower ? [voice('lower', 'bass', lower)] : [])],
  }
}

export const workoutScores = [
  { mode: 'reading', focus: '在五个相邻音之间来回找键', score: drillScore('五指级进', 72,
    [[60, 62, 64, 65], [67, 65, 64, 62], [60, 62, 64, 62], [64, 65, 67, 60]].map(bar => bar.map(pitch => [4, [pitch]]))) },
  { mode: 'reading', focus: '练习看见隔开的音就直接落键', score: drillScore('隔音跳进', 72,
    [[60, 64, 62, 65], [64, 67, 65, 69], [67, 71, 69, 72], [72, 67, 64, 60]].map(bar => bar.map(pitch => [4, [pitch]]))) },
  { mode: 'rhythm', focus: '固定 G，专练什么时候按、什么时候松', score: drillScore('长短音切换', 68, [
    [[2, [67]], [4, [67]], [8, [67]], [8, [67]]], [[8, [67]], [8, [67]], [4, [67]], [2, [67]]],
    [[4, [67]], [8, [67]], [8, [67]], [2, [67]]], [[1, [67]]],
  ]) },
  { mode: 'rhythm', focus: '同一个音，在空拍后准确进入', score: drillScore('休止不抢拍', 68, [
    [[4, [67]], [4], [4, [67]], [4]], [[4], [4, [67]], [2, [67]]],
    [[8, [67]], [8], [4, [67]], [4], [4, [67]]], [[2], [2, [67]]],
  ]) },
  { mode: 'reading', focus: '看清两个音，同时按下', score: drillScore('双音落键', 68,
    [[[60, 64], [62, 65]], [[64, 67], [65, 69]], [[67, 71], [65, 69]], [[64, 67], [60, 64]]].map(bar => bar.map(pitches => [2, pitches]))) },
  { mode: 'rhythm', focus: '让三个音一起落在拍点上', score: drillScore('三和弦落拍', 60, [
    [[2, [60, 64, 67]], [2]], [[2, [60, 65, 69]], [2]], [[2, [62, 67, 71]], [2]], [[1, [60, 64, 67]]],
  ]) },
  { mode: 'reading', focus: '左手保持长音，右手继续移动', score: drillScore('双手配合', 60,
    [[60, 62, 64, 67], [65, 64, 62, 60], [62, 65, 67, 71], [72, 67, 64, 60]].map(bar => bar.map(pitch => [4, [pitch]])),
    [48, 53, 55, 48].map(pitch => [[1, [pitch]]])) },
  { mode: 'rhythm', focus: '双手一起起音，再按不同的时值松键', score: drillScore('双手不同松键', 60,
    [[60, 64, 67, 64], [62, 65, 69, 65], [64, 67, 72, 67], [67, 64, 62, 60]].map(bar => bar.map(pitch => [4, [pitch]])),
    [48, 50, 52, 48].map(pitch => [[2, [pitch]], [2]])) },
] as const
