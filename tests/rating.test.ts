import { describe, expect, it } from 'vitest'
import { applyRatingUpdate, bandOf, expectedScore, nextWorkingLevel } from '../src/engine/rating'
import { initialSubjectProgress } from '../src/types/progress'

describe('expectedScore', () => {
  it('is ~0.5 at the level anchor', () => {
    expect(expectedScore(375, 2)).toBeCloseTo(0.5, 5)
  })
  it('is higher for stronger ratings', () => {
    expect(expectedScore(700, 2)).toBeGreaterThan(0.8)
    expect(expectedScore(100, 4)).toBeLessThan(0.01)
  })
})

describe('bandOf', () => {
  it('maps ratings to display bands', () => {
    expect(bandOf(0)).toBe(1)
    expect(bandOf(249)).toBe(1)
    expect(bandOf(250)).toBe(2)
    expect(bandOf(500)).toBe(3)
    expect(bandOf(750)).toBe(4)
    expect(bandOf(1000)).toBe(4)
  })
})

describe('applyRatingUpdate', () => {
  it('gains on correct, loses on wrong', () => {
    const up = applyRatingUpdate(375, 20, 2, 1)
    const down = applyRatingUpdate(375, 20, 2, 0)
    expect(up.delta).toBeGreaterThan(0)
    expect(down.delta).toBeLessThan(0)
  })

  it('worked example: fresh L2 promotee losing an L2 question drops only ~8 points', () => {
    // R=275, standard K (attempts ≥ 10): E≈0.34 → ΔR≈−8. No flap from one bad day.
    const { delta } = applyRatingUpdate(275, 20, 2, 0)
    expect(delta).toBeLessThan(0)
    expect(Math.abs(delta)).toBeGreaterThan(5)
    expect(Math.abs(delta)).toBeLessThan(12)
  })

  it('clamps delta magnitude and rating range', () => {
    const big = applyRatingUpdate(0, 0, 4, 1, { kOverride: 500 })
    expect(big.delta).toBeLessThanOrEqual(40)
    const low = applyRatingUpdate(3, 20, 4, 0)
    expect(low.rating).toBeGreaterThanOrEqual(0)
    const high = applyRatingUpdate(999, 20, 1, 1)
    expect(high.rating).toBeLessThanOrEqual(1000)
  })

  it('halves K for reviews', () => {
    const normal = applyRatingUpdate(500, 20, 3, 1)
    const review = applyRatingUpdate(500, 20, 3, 1, { isReview: true })
    expect(Math.abs(review.delta)).toBeLessThan(Math.abs(normal.delta))
  })
})

describe('nextWorkingLevel (hysteresis)', () => {
  it('promotes only with rating AND streak', () => {
    const sp = { ...initialSubjectProgress(), workingLevel: 1 as const, rating: 300, correctStreak: 2 }
    expect(nextWorkingLevel(sp).promoted).toBe(false)
    expect(nextWorkingLevel({ ...sp, correctStreak: 3 }).promoted).toBe(true)
  })

  it('demotes immediately below the lower threshold', () => {
    const sp = { ...initialSubjectProgress(), workingLevel: 2 as const, rating: 225, correctStreak: 0 }
    const t = nextWorkingLevel(sp)
    expect(t.demoted).toBe(true)
    expect(t.workingLevel).toBe(1)
  })

  it('holds steady inside the dead zone', () => {
    const sp = { ...initialSubjectProgress(), workingLevel: 2 as const, rating: 250, correctStreak: 5 }
    const t = nextWorkingLevel(sp)
    expect(t.promoted).toBe(false)
    expect(t.demoted).toBe(false)
  })

  it('never promotes past 4 or demotes past 1', () => {
    const top = { ...initialSubjectProgress(), workingLevel: 4 as const, rating: 1000, correctStreak: 10 }
    expect(nextWorkingLevel(top).workingLevel).toBe(4)
    const bottom = { ...initialSubjectProgress(), workingLevel: 1 as const, rating: 0, correctStreak: 0 }
    expect(nextWorkingLevel(bottom).workingLevel).toBe(1)
  })
})
