import type { ChallengeLevel } from '../types/challenge'

/** IANA timezone the whole app (and the email workflow) anchors days to. */
export const APP_TIMEZONE = 'Asia/Jerusalem'

/** Rating bounds */
export const RATING_MIN = 0
export const RATING_MAX = 1000

/** Difficulty anchor (band midpoint) per challenge level */
export const LEVEL_ANCHOR: Record<ChallengeLevel, number> = { 1: 125, 2: 375, 3: 625, 4: 875 }

/** Raw display bands: L1 0–249, L2 250–499, L3 500–749, L4 750–1000 */
export const BAND_FLOOR: Record<ChallengeLevel, number> = { 1: 0, 2: 250, 3: 500, 4: 750 }

/** Elo-lite parameters */
export const ELO_SCALE = 350
export const K_PROVISIONAL = 40
export const K_STANDARD = 24
export const PROVISIONAL_ATTEMPTS = 10
export const RATING_DELTA_CLAMP = 40

/** Promotion requires rating ≥ threshold AND a correct streak at the current level */
export const PROMOTE_THRESHOLD: Record<2 | 3 | 4, number> = { 2: 275, 3: 525, 4: 775 }
export const DEMOTE_THRESHOLD: Record<1 | 2 | 3, number> = { 1: 225, 2: 475, 3: 725 }
export const PROMOTE_STREAK = 3

/** Placement */
export const PLACEMENT_QUESTIONS = 5
export const PLACEMENT_START_RATING = 375
/**
 * Binary-search staircase: the rating moves by these decreasing steps
 * (+step on correct, −step on wrong). Question difficulty follows the
 * running rating's band, so correct answers earn harder questions.
 * 5/5 → 870, 0/5 → floor, alternating → mid-range.
 */
export const PLACEMENT_STEPS = [200, 120, 80, 55, 40]
export const PLACEMENT_RATING_FLOOR = 50
export const PLACEMENT_RATING_CEIL = 900
export const PLACEMENT_XP_PER_QUESTION = 5
export const PLACEMENT_XP_BONUS = 20
export const PLACEMENT_SKIP_RATING = 125

/** XP */
export const WRONG_ANSWER_XP = 2
export const STREAK_MULT_PER_DAY = 0.01
export const STREAK_MULT_CAP_DAYS = 30
export const SPEED_BONUS_FRACTION = 0.2
export const REVIEW_XP_FRACTION = 0.5
export const PRACTICE_XP_FRACTION = 0.25
export const REVIEW_RETIRE_BONUS = 10
export const DAILY_ALL_DONE_BONUS = 15
export const PERFECT_DAY_BONUS = 25

/** SRS */
export const SRS_START_EF = 2.3
export const SRS_MIN_EF = 1.3
export const SRS_MAX_EF = 2.8
export const SRS_RETIRE_REPS = 4
export const SRS_LAPSE_EF_PENALTY = 0.2

/** Selection */
export const DAILY_MAX_REVIEWS = 2
export const CUSTOM_CHALLENGE_CAP = 100
export const HISTORY_CAP = 500
export const DAILY_LOG_CAP = 400

/** Streak freeze tokens */
export const FREEZE_TOKEN_CAP = 2
/** Earn a freeze token every N-day streak milestone */
export const FREEZE_TOKEN_EVERY = 7

/** Overall level curve: cumulative XP required to REACH level n (n ≥ 1). */
export function xpThreshold(level: number): number {
  if (level <= 1) return 0
  return 25 * level * level + 25 * level - 50
}

/** Rank titles by overall level */
export const RANK_TITLES: Array<{ level: number; title: string }> = [
  { level: 1, title: 'Boot Camp Cadet' },
  { level: 3, title: 'Terminal Tamer' },
  { level: 5, title: 'On-Call Rookie' },
  { level: 8, title: 'Incident Wrangler' },
  { level: 12, title: 'Pipeline Pilot' },
  { level: 16, title: 'Infra Whisperer' },
  { level: 20, title: 'Reliability Sage' },
  { level: 25, title: 'DevOps Architect' },
  { level: 30, title: 'Legend of the Pager' },
]
