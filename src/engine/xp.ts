import type { Challenge } from '../types/challenge'
import type { AttemptSource } from '../types/progress'
import {
  PRACTICE_XP_FRACTION,
  RANK_TITLES,
  REVIEW_XP_FRACTION,
  SPEED_BONUS_FRACTION,
  STREAK_MULT_CAP_DAYS,
  STREAK_MULT_PER_DAY,
  WRONG_ANSWER_XP,
  xpThreshold,
} from './constants'

export { xpThreshold }

export function streakMultiplier(streakDays: number): number {
  return 1 + STREAK_MULT_PER_DAY * Math.min(Math.max(streakDays, 0), STREAK_MULT_CAP_DAYS)
}

export interface XpBreakdown {
  xp: number
  base: number
  multiplier: number
  speedBonus: number
}

export function xpForAttempt(
  challenge: Challenge,
  correct: boolean,
  timeSec: number,
  src: AttemptSource,
  streakDays: number,
): XpBreakdown {
  if (!correct) return { xp: WRONG_ANSWER_XP, base: 0, multiplier: 1, speedBonus: 0 }
  const srcFraction = src === 'review' ? REVIEW_XP_FRACTION : src === 'practice' ? PRACTICE_XP_FRACTION : 1
  const base = Math.ceil(challenge.xp * srcFraction)
  const multiplier = streakMultiplier(streakDays)
  const fast = timeSec > 0 && timeSec <= 30 * challenge.estMinutes
  const speedBonus = fast ? Math.round(base * SPEED_BONUS_FRACTION) : 0
  return { xp: Math.round(base * multiplier) + speedBonus, base, multiplier, speedBonus }
}

/** Highest overall level whose threshold is met by `xp` */
export function levelForXp(xp: number): number {
  let level = 1
  while (xpThreshold(level + 1) <= xp) level++
  return level
}

/** Progress fraction toward the next overall level, 0..1 */
export function levelProgress(xp: number): { level: number; into: number; needed: number; fraction: number } {
  const level = levelForXp(xp)
  const cur = xpThreshold(level)
  const next = xpThreshold(level + 1)
  const into = xp - cur
  const needed = next - cur
  return { level, into, needed, fraction: Math.min(1, into / needed) }
}

export function rankTitle(level: number): string {
  let title = RANK_TITLES[0].title
  for (const r of RANK_TITLES) if (level >= r.level) title = r.title
  return title
}

/** The next rank milestone above the current level, if any */
export function nextRank(level: number): { level: number; title: string } | null {
  for (const r of RANK_TITLES) if (r.level > level) return r
  return null
}
