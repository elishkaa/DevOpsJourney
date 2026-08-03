import type { ChallengeLevel } from '../types/challenge'
import type { SubjectProgress } from '../types/progress'
import {
  BAND_FLOOR,
  DEMOTE_THRESHOLD,
  ELO_SCALE,
  K_PROVISIONAL,
  K_STANDARD,
  LEVEL_ANCHOR,
  PROMOTE_STREAK,
  PROMOTE_THRESHOLD,
  PROVISIONAL_ATTEMPTS,
  RATING_DELTA_CLAMP,
  RATING_MAX,
  RATING_MIN,
} from './constants'

export function clampRating(r: number): number {
  return Math.max(RATING_MIN, Math.min(RATING_MAX, r))
}

/** Expected score of the user against a challenge of the given level */
export function expectedScore(rating: number, level: ChallengeLevel): number {
  return 1 / (1 + Math.pow(10, (LEVEL_ANCHOR[level] - rating) / ELO_SCALE))
}

/** Raw display band for a rating */
export function bandOf(rating: number): ChallengeLevel {
  if (rating >= BAND_FLOOR[4]) return 4
  if (rating >= BAND_FLOOR[3]) return 3
  if (rating >= BAND_FLOOR[2]) return 2
  return 1
}

export interface RatingUpdate {
  rating: number
  delta: number
}

/**
 * Elo-lite update. `score` is 1 for correct, 0 for wrong (AI grading may pass
 * fractional scores). K is halved for review attempts (weaker evidence).
 */
export function applyRatingUpdate(
  rating: number,
  attempts: number,
  level: ChallengeLevel,
  score: number,
  opts: { isReview?: boolean; kOverride?: number } = {},
): RatingUpdate {
  let k = opts.kOverride ?? (attempts < PROVISIONAL_ATTEMPTS ? K_PROVISIONAL : K_STANDARD)
  if (opts.isReview) k = k / 2
  const e = expectedScore(rating, level)
  const raw = k * (score - e)
  const delta = Math.max(-RATING_DELTA_CLAMP, Math.min(RATING_DELTA_CLAMP, raw))
  const next = clampRating(rating + delta)
  return { rating: next, delta: next - rating }
}

export interface LevelTransition {
  workingLevel: ChallengeLevel
  promoted: boolean
  demoted: boolean
}

/**
 * Promotion needs rating ≥ threshold AND ≥3 consecutive correct at the current
 * working level. Demotion is immediate below the lower threshold. The 50-point
 * dead zone between thresholds prevents level flapping.
 */
export function nextWorkingLevel(sp: SubjectProgress): LevelTransition {
  const { workingLevel, rating, correctStreak } = sp
  if (workingLevel < 4) {
    const t = PROMOTE_THRESHOLD[(workingLevel + 1) as 2 | 3 | 4]
    if (rating >= t && correctStreak >= PROMOTE_STREAK) {
      return { workingLevel: (workingLevel + 1) as ChallengeLevel, promoted: true, demoted: false }
    }
  }
  if (workingLevel > 1) {
    const t = DEMOTE_THRESHOLD[(workingLevel - 1) as 1 | 2 | 3]
    if (rating <= t) {
      return { workingLevel: (workingLevel - 1) as ChallengeLevel, promoted: false, demoted: true }
    }
  }
  return { workingLevel, promoted: false, demoted: false }
}
