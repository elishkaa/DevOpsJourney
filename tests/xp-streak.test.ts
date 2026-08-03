import { describe, expect, it } from 'vitest'
import { levelForXp, levelProgress, nextRank, rankTitle, streakMultiplier, xpForAttempt, xpThreshold } from '../src/engine/xp'
import { advanceStreak, streakAtRisk } from '../src/engine/streak'
import { makeMcq } from './fixtures'
import type { StreakState } from '../src/types/progress'

describe('xp', () => {
  const c = makeMcq({ level: 2, xp: 20, estMinutes: 2 })

  it('wrong answers earn flat effort XP', () => {
    expect(xpForAttempt(c, false, 30, 'daily', 10).xp).toBe(2)
  })

  it('correct = base × streak multiplier (+ speed bonus when fast)', () => {
    const slow = xpForAttempt(c, true, 500, 'daily', 0)
    expect(slow.xp).toBe(20)
    const fast = xpForAttempt(c, true, 30, 'daily', 0)
    expect(fast.speedBonus).toBe(4)
    expect(fast.xp).toBe(24)
    const streaky = xpForAttempt(c, true, 500, 'daily', 30)
    expect(streaky.xp).toBe(26) // 20 × 1.30
  })

  it('reviews earn half, practice a quarter', () => {
    expect(xpForAttempt(c, true, 500, 'review', 0).base).toBe(10)
    expect(xpForAttempt(c, true, 500, 'practice', 0).base).toBe(5)
  })

  it('multiplier caps at 30 days', () => {
    expect(streakMultiplier(30)).toBeCloseTo(1.3)
    expect(streakMultiplier(300)).toBeCloseTo(1.3)
  })

  it('level curve: thresholds and lookups agree', () => {
    expect(xpThreshold(1)).toBe(0)
    expect(xpThreshold(2)).toBe(100)
    expect(xpThreshold(3)).toBe(250)
    expect(levelForXp(0)).toBe(1)
    expect(levelForXp(99)).toBe(1)
    expect(levelForXp(100)).toBe(2)
    expect(levelForXp(250)).toBe(3)
    const p = levelProgress(150)
    expect(p.level).toBe(2)
    expect(p.into).toBe(50)
    expect(p.needed).toBe(150)
  })

  it('rank titles progress', () => {
    expect(rankTitle(1)).toBe('Boot Camp Cadet')
    expect(rankTitle(4)).toBe('Terminal Tamer')
    expect(rankTitle(30)).toBe('Legend of the Pager')
    expect(nextRank(1)?.level).toBe(3)
    expect(nextRank(99)).toBeNull()
  })
})

describe('streak', () => {
  const fresh: StreakState = { current: 0, best: 0, lastActiveDay: null, freezeTokens: 1 }

  it('starts, extends, and stays flat within a day', () => {
    let s = advanceStreak(fresh, '2026-08-01')
    expect(s.event).toBe('started')
    expect(s.streak.current).toBe(1)
    s = advanceStreak(s.streak, '2026-08-01')
    expect(s.event).toBe('same')
    s = advanceStreak(s.streak, '2026-08-02')
    expect(s.event).toBe('extended')
    expect(s.streak.current).toBe(2)
  })

  it('a freeze token covers exactly one missed day', () => {
    let s = advanceStreak(fresh, '2026-08-01')
    s = advanceStreak(s.streak, '2026-08-03') // skipped Aug 2
    expect(s.event).toBe('frozen')
    expect(s.streak.current).toBe(2)
    expect(s.streak.freezeTokens).toBe(0)
  })

  it('resets without a token or after a 2+ day gap', () => {
    let s = advanceStreak({ ...fresh, freezeTokens: 0 }, '2026-08-01')
    s = advanceStreak(s.streak, '2026-08-03')
    expect(s.event).toBe('reset')
    expect(s.streak.current).toBe(1)

    let s2 = advanceStreak(fresh, '2026-08-01')
    s2 = advanceStreak(s2.streak, '2026-08-05')
    expect(s2.event).toBe('reset')
  })

  it('earns a freeze token at 7-day marks (capped at 2)', () => {
    let st: StreakState = { current: 6, best: 6, lastActiveDay: '2026-08-06', freezeTokens: 2 }
    const s = advanceStreak(st, '2026-08-07')
    expect(s.streak.current).toBe(7)
    expect(s.streak.freezeTokens).toBe(2) // capped
    st = { current: 6, best: 6, lastActiveDay: '2026-08-06', freezeTokens: 0 }
    expect(advanceStreak(st, '2026-08-07').streak.freezeTokens).toBe(1)
  })

  it('reports milestones', () => {
    const st: StreakState = { current: 2, best: 2, lastActiveDay: '2026-08-01', freezeTokens: 0 }
    expect(advanceStreak(st, '2026-08-02').milestone).toBe(3)
  })

  it('flags a streak at risk only when yesterday was the last active day', () => {
    const st: StreakState = { current: 3, best: 3, lastActiveDay: '2026-08-01', freezeTokens: 0 }
    expect(streakAtRisk(st, '2026-08-02')).toBe(true)
    expect(streakAtRisk(st, '2026-08-01')).toBe(false)
    expect(streakAtRisk({ ...st, current: 0 }, '2026-08-02')).toBe(false)
  })
})
