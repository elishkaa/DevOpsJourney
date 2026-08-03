import { describe, expect, it } from 'vitest'
import { applyAttempt } from '../src/engine/applyAttempt'
import { buildDailySet } from '../src/engine/selector'
import { freshProgress, makeMcq, makePool, NOW, TODAY } from './fixtures'
import type { Graded } from '../src/engine/grading'

const RIGHT: Graded = { correct: true, score: 1 }
const WRONG: Graded = { correct: false, score: 0 }

describe('applyAttempt', () => {
  const c = makeMcq({ subject: 'linux', level: 1, id: 'linux-l1-aa-1' })

  it('a correct daily answer updates rating, xp, streak, seen/completed, history', () => {
    const p0 = freshProgress()
    const { progress: p1, outcome } = applyAttempt(p0, c, RIGHT, { now: NOW, src: 'daily', timeSec: 40 })

    expect(outcome.correct).toBe(true)
    expect(outcome.ratingDelta).toBeGreaterThan(0)
    expect(p1.subjects.linux.rating).toBeGreaterThan(p0.subjects.linux.rating)
    expect(p1.xp).toBeGreaterThan(0)
    expect(p1.streak.current).toBe(1)
    expect(p1.subjects.linux.seenIds).toContain(c.id)
    expect(p1.subjects.linux.completedIds).toContain(c.id)
    expect(p1.history).toHaveLength(1)
    expect(p1.dailyLog[TODAY].done).toBe(1)
    expect(p1.badges['ach_first_blood']).toBeTruthy()
  })

  it('a wrong answer earns effort XP and schedules a review', () => {
    const p0 = freshProgress()
    const { progress: p1, outcome } = applyAttempt(p0, c, WRONG, { now: NOW, src: 'daily', timeSec: 40 })
    expect(outcome.correct).toBe(false)
    expect(outcome.xpEarned).toBe(2)
    expect(outcome.reviewScheduled).toBe(true)
    expect(p1.reviewQueue).toHaveLength(1)
    expect(p1.subjects.linux.completedIds).not.toContain(c.id)
  })

  it('practice never moves the rating', () => {
    const p0 = freshProgress()
    const { progress: p1, outcome } = applyAttempt(p0, c, RIGHT, { now: NOW, src: 'practice', timeSec: 40 })
    expect(outcome.ratingDelta).toBe(0)
    expect(p1.subjects.linux.rating).toBe(p0.subjects.linux.rating)
    expect(p1.xp).toBeGreaterThan(0)
  })

  it('completing every daily slot pays the all-done (and perfect) bonuses once', () => {
    let p = freshProgress()
    const bank = makePool('linux', 4)
    p = { ...p, dailyCache: buildDailySet(TODAY, bank, p, 2, false) }
    const ids = p.dailyCache!.slots.map((s) => s.challengeId)
    expect(ids.length).toBe(2)

    const first = bank.find((b) => b.id === ids[0])!
    const second = bank.find((b) => b.id === ids[1])!

    let r = applyAttempt(p, first, RIGHT, { now: NOW, src: 'daily', timeSec: 1000 })
    expect(r.outcome.dailyAllDone).toBe(false)
    r = applyAttempt(r.progress, second, RIGHT, { now: NOW, src: 'daily', timeSec: 1000 })
    expect(r.outcome.dailyAllDone).toBe(true)
    expect(r.outcome.perfectDay).toBe(true)
    expect(r.progress.dailyLog[TODAY].perfect).toBe(true)
    // slot marking is idempotent — replay does not re-award
    const again = applyAttempt(r.progress, second, RIGHT, { now: NOW, src: 'daily', timeSec: 1000 })
    expect(again.outcome.dailyAllDone).toBe(false)
  })

  it('review attempts advance SRS and can retire items', () => {
    let p = freshProgress()
    // miss it once → queued
    p = applyAttempt(p, c, WRONG, { now: NOW, src: 'daily', timeSec: 30 }).progress
    expect(p.reviewQueue).toHaveLength(1)
    // review it correctly 4 times → retired
    let retired = false
    for (let i = 0; i < 4; i++) {
      const r = applyAttempt(p, c, RIGHT, { now: NOW, src: 'review', timeSec: 20 })
      p = r.progress
      retired = r.outcome.reviewRetired
    }
    expect(retired).toBe(true)
    expect(p.reviewQueue).toHaveLength(0)
    expect(p.counters.retired).toBe(1)
  })

  it('promotion happens with rating + streak and resets the gate streak', () => {
    let p = freshProgress()
    p = {
      ...p,
      subjects: {
        ...p.subjects,
        linux: { ...p.subjects.linux, rating: 272, correctStreak: 2, attempts: 20 },
      },
    }
    const l1 = makeMcq({ subject: 'linux', level: 1, id: 'linux-l1-promo' })
    const { progress: p1, outcome } = applyAttempt(p, l1, RIGHT, { now: NOW, src: 'daily', timeSec: 30 })
    expect(outcome.promotedTo).toBe(2)
    expect(p1.subjects.linux.workingLevel).toBe(2)
    expect(p1.subjects.linux.correctStreak).toBe(0)
    expect(p1.subjects.linux.levelPeak).toBe(2)
    expect(p1.badges['subj_linux_bronze']).toBeTruthy()
  })

  it('comeback counter fires after 3 straight misses then a hit', () => {
    let p = freshProgress()
    for (let i = 0; i < 3; i++) {
      p = applyAttempt(p, makeMcq({ subject: 'git', level: 1, id: `git-l1-m${i}` }), WRONG, {
        now: NOW,
        src: 'practice',
        timeSec: 30,
      }).progress
    }
    const r = applyAttempt(p, makeMcq({ subject: 'git', level: 1, id: 'git-l1-hit' }), RIGHT, {
      now: NOW,
      src: 'practice',
      timeSec: 30,
    })
    expect(r.progress.counters.comebacks).toBe(1)
    expect(r.progress.badges['ach_comeback']).toBeTruthy()
  })

  it('invariants: xp never negative, rating stays in [0,1000], badges never revoked', () => {
    let p = freshProgress()
    p = { ...p, badges: { ach_first_blood: '2026-08-01T00:00:00Z' } }
    for (let i = 0; i < 60; i++) {
      const ch = makeMcq({ subject: 'linux', level: ((i % 4) + 1) as 1 | 2 | 3 | 4, id: `linux-inv-${i}` })
      const r = applyAttempt(p, ch, i % 3 === 0 ? RIGHT : WRONG, { now: NOW, src: 'daily', timeSec: 30 })
      p = r.progress
      expect(p.xp).toBeGreaterThanOrEqual(0)
      expect(p.subjects.linux.rating).toBeGreaterThanOrEqual(0)
      expect(p.subjects.linux.rating).toBeLessThanOrEqual(1000)
      expect(p.badges['ach_first_blood']).toBeTruthy()
    }
  })
})
