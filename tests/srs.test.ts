import { describe, expect, it } from 'vitest'
import { dueItems, onMiss, onReview, reviewQuality } from '../src/engine/srs'
import { makeMcq, TODAY } from './fixtures'
import type { ReviewItem } from '../src/types/progress'

const c = makeMcq({ id: 'linux-l1-srs-test', fundamental: 'permissions' })

describe('onMiss', () => {
  it('creates a review item due tomorrow', () => {
    const q = onMiss([], c, TODAY)
    expect(q).toHaveLength(1)
    expect(q[0]).toMatchObject({
      challengeId: c.id,
      concept: 'permissions',
      repetitions: 0,
      intervalDays: 1,
      dueDay: '2026-08-03',
    })
  })

  it('a repeat miss resets and counts a lapse with an EF penalty', () => {
    let q = onMiss([], c, TODAY)
    const ef0 = q[0].easiness
    q = onMiss(q, c, '2026-08-05')
    expect(q).toHaveLength(1)
    expect(q[0].lapses).toBe(1)
    expect(q[0].easiness).toBeLessThan(ef0)
    expect(q[0].dueDay).toBe('2026-08-06')
  })
})

describe('onReview', () => {
  function seeded(): ReviewItem[] {
    return onMiss([], c, TODAY)
  }

  it('grows intervals 1 → 3 → EF-scaled on successful reviews', () => {
    let q = seeded()
    let r = onReview(q, c.id, 4, '2026-08-03')
    expect(r.queue[0].intervalDays).toBe(1)
    r = onReview(r.queue, c.id, 4, '2026-08-04')
    expect(r.queue[0].intervalDays).toBe(3)
    const efBefore = r.queue[0].easiness
    r = onReview(r.queue, c.id, 5, '2026-08-07')
    expect(r.queue[0].intervalDays).toBe(Math.round(3 * efBefore))
  })

  it('retires after 4 successful repetitions', () => {
    let q = seeded()
    let retired = false
    let day = '2026-08-03'
    for (let i = 0; i < 4; i++) {
      const r = onReview(q, c.id, 5, day)
      q = r.queue
      retired = r.retired
      day = '2026-08-1' + (5 + i)
    }
    expect(retired).toBe(true)
    expect(q).toHaveLength(0)
  })

  it('a failed review resets repetitions and schedules tomorrow', () => {
    let q = seeded()
    q = onReview(q, c.id, 4, '2026-08-03').queue
    const r = onReview(q, c.id, 2, '2026-08-04')
    expect(r.queue[0].repetitions).toBe(0)
    expect(r.queue[0].lapses).toBe(1)
    expect(r.queue[0].dueDay).toBe('2026-08-05')
  })

  it('EF never drops below 1.3', () => {
    let q = seeded()
    for (let i = 0; i < 12; i++) q = onReview(q, c.id, 2, TODAY).queue
    expect(q[0].easiness).toBeGreaterThanOrEqual(1.3)
  })
})

describe('dueItems / reviewQuality', () => {
  it('returns only items due today or earlier', () => {
    const q = onMiss([], c, TODAY)
    expect(dueItems(q, TODAY)).toHaveLength(0)
    expect(dueItems(q, '2026-08-03')).toHaveLength(1)
    expect(dueItems(q, '2026-09-01')).toHaveLength(1)
  })

  it('maps correctness and speed to quality', () => {
    expect(reviewQuality(false, 10, 2)).toBe(2)
    expect(reviewQuality(true, 30, 2)).toBe(5)
    expect(reviewQuality(true, 500, 2)).toBe(4)
  })
})
