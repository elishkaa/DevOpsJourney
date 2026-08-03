import type { Challenge, SubjectId } from '../types/challenge'
import {
  PLACEMENT_QUESTIONS,
  PLACEMENT_RATING_CEIL,
  PLACEMENT_RATING_FLOOR,
  PLACEMENT_START_RATING,
  PLACEMENT_STEPS,
} from './constants'
import { bandOf, clampRating } from './rating'
import { seededShuffle } from './rng'

export interface PlacementState {
  subject: SubjectId
  /** Questions answered so far (0..PLACEMENT_QUESTIONS) */
  step: number
  rating: number
  askedIds: string[]
  answers: boolean[]
  done: boolean
}

export function startPlacement(subject: SubjectId): PlacementState {
  return {
    subject,
    step: 0,
    rating: PLACEMENT_START_RATING,
    askedIds: [],
    answers: [],
    done: false,
  }
}

/**
 * Pick the next placement question at the band of the current running rating.
 * Prefers challenges not yet asked; falls back to adjacent levels when the
 * band has no candidates. Deterministic per (subject, step).
 */
export function nextPlacementQuestion(state: PlacementState, pool: Challenge[]): Challenge | null {
  const targetLevel = bandOf(state.rating)
  const candidates = pool.filter(
    (c) => c.subject === state.subject && c.type !== 'free' && !state.askedIds.includes(c.id),
  )
  if (candidates.length === 0) return null

  const byLevel = (lvl: number) => candidates.filter((c) => c.level === lvl)
  const order: number[] = [targetLevel, targetLevel - 1, targetLevel + 1, targetLevel - 2, targetLevel + 2]
  for (const lvl of order) {
    if (lvl < 1 || lvl > 4) continue
    const atLevel = byLevel(lvl)
    if (atLevel.length > 0) {
      return seededShuffle(atLevel, `placement:${state.subject}:${state.step}`)[0]
    }
  }
  return null
}

/** Apply an answer with the binary-search staircase; returns the advanced state. */
export function answerPlacement(state: PlacementState, challenge: Challenge, correct: boolean): PlacementState {
  const delta = PLACEMENT_STEPS[Math.min(state.step, PLACEMENT_STEPS.length - 1)]
  const rating = clampRating(state.rating + (correct ? delta : -delta))
  const step = state.step + 1
  const done = step >= PLACEMENT_QUESTIONS
  return {
    ...state,
    step,
    rating: done
      ? clampRating(Math.max(PLACEMENT_RATING_FLOOR, Math.min(PLACEMENT_RATING_CEIL, rating)))
      : rating,
    askedIds: [...state.askedIds, challenge.id],
    answers: [...state.answers, correct],
    done,
  }
}
