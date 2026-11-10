import { compoundScore, workoutScores } from './examples'
import type { Score } from './score'

export type LessonMode = 'reading' | 'rhythm' | null

export interface Lesson {
  id: string
  title: string
  instruction: string
  scoreId: string
  mode: LessonMode
}

export interface Course {
  title: string
  lessons: readonly Lesson[]
  scores: ReadonlyMap<string, Score>
}

const warmup = workoutScores[0].score
export const beginnerCourse: Course = {
  title: '入门练习',
  scores: new Map([['warmup', warmup], ['rhythm', compoundScore]]),
  lessons: [
    { id: 'find-notes', title: '认音', instruction: '先认清音高，弹对并松键后继续。', scoreId: 'warmup', mode: 'reading' },
    { id: 'keep-beat', title: '按拍弹', instruction: '沿用上一课的音符，谱面先滚过一个空白小节，第一拍到线时落键。', scoreId: 'warmup', mode: 'rhythm' },
    { id: 'duration', title: '长短音与休止', instruction: '留意每个音要按多久，以及休止后何时再进入。', scoreId: 'rhythm', mode: 'rhythm' },
  ],
}
