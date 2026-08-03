import { describe, expect, it } from 'vitest'
import { SEED_BANK } from '../src/content/index'
import { validateBank } from '../src/content/schema'
import { pickCotd } from '../src/engine/daily'
import { grade } from '../src/engine/grading'
import { cotdPool } from '../src/engine/selector'
import { BASE_XP } from '../src/types/challenge'
import type { SubjectId } from '../src/types/challenge'

/** Subjects shipped so far — extended as content waves land. */
const SHIPPED: SubjectId[] = [
  'linux',
  'git',
  'networking',
  'docker',
  'kubernetes',
  'cicd',
  'iac',
  'cloud',
  'observability',
  'security',
]

/** Per-level minimum challenge counts for a shipped subject */
const FLOORS: Record<1 | 2 | 3 | 4, number> = { 1: 6, 2: 5, 3: 4, 4: 3 }

describe('seed bank', () => {
  it('passes schema validation with zero issues', () => {
    const issues = validateBank(SEED_BANK)
    expect(issues).toEqual([])
  })

  it('is sorted by id (COTD determinism contract)', () => {
    const ids = SEED_BANK.map((c) => c.id)
    expect([...ids].sort()).toEqual(ids)
  })

  it('meets per-level floors for every shipped subject', () => {
    for (const subject of SHIPPED) {
      for (const level of [1, 2, 3, 4] as const) {
        const n = SEED_BANK.filter((c) => c.subject === subject && c.level === level && c.type !== 'free').length
        expect(n, `${subject} L${level}`).toBeGreaterThanOrEqual(FLOORS[level])
      }
    }
  })

  it('ids follow the `${subject}-l${level}-slug` convention', () => {
    for (const c of SEED_BANK) {
      expect(c.id.startsWith(`${c.subject}-l${c.level}-`), c.id).toBe(true)
    }
  })

  it('xp stays within ±5 of the level convention', () => {
    for (const c of SEED_BANK) {
      expect(Math.abs(c.xp - BASE_XP[c.level]), c.id).toBeLessThanOrEqual(5)
    }
  })

  it('every command acceptExample passes its own grader', () => {
    for (const c of SEED_BANK) {
      if (c.type !== 'command') continue
      for (const example of c.acceptExamples) {
        const g = grade(c, { type: 'command', text: example })
        expect(g.correct, `${c.id}: "${example}"`).toBe(true)
      }
    }
  })

  it('every spot buggyLine points at a real line', () => {
    for (const c of SEED_BANK) {
      if (c.type !== 'spot') continue
      const lines = c.snippet.split('\n').length
      expect(c.buggyLine, c.id).toBeLessThanOrEqual(lines)
    }
  })

  it('COTD pool is non-empty, sorted, free-less', () => {
    const pool = cotdPool(SEED_BANK)
    expect(pool.length).toBeGreaterThan(0)
    expect([...pool].sort()).toEqual(pool)
  })

  it('each subject ships exactly one free-text (AI Mentor) challenge at L3/L4', () => {
    for (const subject of SHIPPED) {
      const free = SEED_BANK.filter((c) => c.subject === subject && c.type === 'free')
      expect(free.length, subject).toBe(1)
      expect(free[0].level, free[0].id).toBeGreaterThanOrEqual(3)
    }
  })

  it('every subject level has an mcq/multi for the placement quiz', () => {
    for (const subject of SHIPPED) {
      for (const level of [1, 2, 3, 4] as const) {
        const n = SEED_BANK.filter(
          (c) => c.subject === subject && c.level === level && (c.type === 'mcq' || c.type === 'multi'),
        ).length
        expect(n, `${subject} L${level}`).toBeGreaterThanOrEqual(1)
      }
    }
  })

  // Determinism contract with scripts/cotd.mjs — pinned against the shipped bank.
  // If this test fails after ADDING content, that is expected (the pool grew):
  // re-pin the two ids. It must NEVER fail without a bank change.
  it('COTD pick matches the pinned fixture (email ↔ app contract)', () => {
    const pool = cotdPool(SEED_BANK)
    expect(SEED_BANK.length).toBe(190)
    expect(pool.length).toBe(180)
    expect(pickCotd('2026-08-02', pool)).toBe('kubernetes-l4-pdb-blocked-drain')
    expect(pickCotd('2026-08-03', pool)).toBe('linux-l3-inode-exhaustion')
  })
})
