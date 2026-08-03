import type { StreakState } from '../types/progress'
import { FREEZE_TOKEN_CAP, FREEZE_TOKEN_EVERY } from './constants'
import { dayDiff } from './daily'

export type StreakEvent = 'same' | 'started' | 'extended' | 'frozen' | 'reset'

export interface StreakUpdate {
  streak: StreakState
  event: StreakEvent
  /** Set when the new current streak hits a celebration milestone */
  milestone: number | null
}

const MILESTONES = [3, 7, 14, 30, 60, 100]

/** Advance the streak for an activity on `today` (a dayKey). */
export function advanceStreak(streak: StreakState, today: string): StreakUpdate {
  const s = { ...streak }
  let event: StreakEvent

  if (s.lastActiveDay === today) {
    return { streak: s, event: 'same', milestone: null }
  }

  if (s.lastActiveDay === null) {
    s.current = 1
    event = 'started'
  } else {
    const gap = dayDiff(s.lastActiveDay, today)
    if (gap === 1) {
      s.current += 1
      event = 'extended'
    } else if (gap === 2 && s.freezeTokens > 0) {
      // One missed day, covered by a freeze token
      s.freezeTokens -= 1
      s.current += 1
      event = 'frozen'
    } else {
      s.current = 1
      event = 'reset'
    }
  }

  s.lastActiveDay = today
  if (s.current > s.best) s.best = s.current

  // Earn a freeze token at every FREEZE_TOKEN_EVERY-day mark
  if (event !== 'reset' && s.current > 0 && s.current % FREEZE_TOKEN_EVERY === 0) {
    s.freezeTokens = Math.min(FREEZE_TOKEN_CAP, s.freezeTokens + 1)
  }

  const milestone = MILESTONES.includes(s.current) ? s.current : null
  return { streak: s, event, milestone }
}

/** True when today's activity hasn't happened yet and the streak would die tomorrow. */
export function streakAtRisk(streak: StreakState, today: string): boolean {
  if (streak.current === 0 || streak.lastActiveDay === null) return false
  if (streak.lastActiveDay === today) return false
  return dayDiff(streak.lastActiveDay, today) === 1
}
