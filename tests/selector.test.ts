import { describe, expect, it } from 'vitest'
import { buildDailySet, cotdPool, pickPractice } from '../src/engine/selector'
import { onMiss } from '../src/engine/srs'
import { freshProgress, makeMcq, makePool, TODAY } from './fixtures'
import type { Challenge } from '../src/types/challenge'

const bank: Challenge[] = [...makePool('linux', 4), ...makePool('docker', 4), ...makePool('git', 4)]

describe('cotdPool', () => {
  it('is sorted and excludes free challenges', () => {
    const withFree: Challenge[] = [
      ...bank,
      { ...makeMcq({ id: 'zz-l3-free' }), type: 'free', rubric: 'r'.repeat(12), modelAnswer: 'm'.repeat(12) } as never,
    ]
    const pool = cotdPool(withFree)
    expect(pool).not.toContain('zz-l3-free')
    expect([...pool].sort()).toEqual(pool)
  })
})

describe('buildDailySet', () => {
  it('slot 1 is the COTD; set size honors the goal; no duplicate ids', () => {
    const p = freshProgress()
    const set = buildDailySet(TODAY, bank, p, 3, false)
    expect(set.dayKey).toBe(TODAY)
    expect(set.slots[0].kind).toBe('cotd')
    expect(set.slots).toHaveLength(3)
    const ids = set.slots.map((s) => s.challengeId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('is deterministic for the same day and inputs', () => {
    const p = freshProgress()
    const a = buildDailySet(TODAY, bank, p, 3, false)
    const b = buildDailySet(TODAY, bank, p, 3, false)
    expect(a).toEqual(b)
  })

  it('includes due reviews (max 2) after the COTD', () => {
    let p = freshProgress()
    let queue = p.reviewQueue
    for (const id of ['linux-l1-pool-0', 'linux-l1-pool-1', 'linux-l1-pool-2']) {
      const c = bank.find((b) => b.id === id)!
      queue = onMiss(queue, c, '2026-07-30')
    }
    p = { ...p, reviewQueue: queue }
    const set = buildDailySet(TODAY, bank, p, 5, false)
    const reviewSlots = set.slots.filter((s) => s.kind === 'review')
    expect(reviewSlots.length).toBe(2)
  })

  it('serves new challenges at the working level', () => {
    let p = freshProgress()
    p = {
      ...p,
      subjects: { ...p.subjects, docker: { ...p.subjects.docker, workingLevel: 3, rating: 600 } },
    }
    const set = buildDailySet(TODAY, bank, p, 6, false)
    const newIds = set.slots.filter((s) => s.kind === 'new').map((s) => s.challengeId)
    const dockerNew = newIds.filter((id) => id.startsWith('docker-'))
    for (const id of dockerNew) {
      const c = bank.find((b) => b.id === id)!
      expect(c.level).toBe(3)
    }
  })

  it('excludes already-seen challenges from new slots', () => {
    let p = freshProgress()
    const seen = bank.filter((c) => c.subject === 'linux').map((c) => c.id)
    p = { ...p, subjects: { ...p.subjects, linux: { ...p.subjects.linux, seenIds: seen } } }
    const set = buildDailySet(TODAY, bank, p, 8, false)
    const newIds = set.slots.filter((s) => s.kind === 'new').map((s) => s.challengeId)
    for (const id of newIds) expect(id.startsWith('linux-')).toBe(false)
  })
})

describe('pickPractice', () => {
  it('prefers unseen at working level, falls back to seen', () => {
    let p = freshProgress()
    const first = pickPractice('git', bank, p, false, 'seed-1')
    expect(first).not.toBeNull()
    expect(first!.subject).toBe('git')
    expect(first!.level).toBe(1)

    const allGit = bank.filter((c) => c.subject === 'git').map((c) => c.id)
    p = { ...p, subjects: { ...p.subjects, git: { ...p.subjects.git, seenIds: allGit } } }
    const again = pickPractice('git', bank, p, false, 'seed-2')
    expect(again).not.toBeNull()
  })

  it('returns null when a subject has no content', () => {
    const p = freshProgress()
    expect(pickPractice('security', bank, p, false, 's')).toBeNull()
  })
})
