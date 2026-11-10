import { parseScore, serializeScore, type Score } from './score'

export interface PersonalScore { id: string; score: Score }

const storageKey = 'mns.personal-scores.v1'
export function loadPersonalScores(): PersonalScore[] {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as { id: string; json: string }[]
    return stored.map(({ id, json }) => ({ id, score: parseScore(json) }))
  } catch { return [] }
}

export function savePersonalScores(items: PersonalScore[]) {
  localStorage.setItem(storageKey, JSON.stringify(items.map(({ id, score }) => ({ id, json: serializeScore(score) }))))
}
