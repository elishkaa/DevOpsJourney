import type { Challenge, ChallengeLevel, McqChallenge, SubjectId } from '../src/types/challenge'
import { initialProgress } from '../src/types/progress'
import type { UserProgress } from '../src/types/progress'

let counter = 0

export function makeMcq(overrides: Partial<McqChallenge> = {}): McqChallenge {
  counter++
  const level = (overrides.level ?? 1) as ChallengeLevel
  return {
    id: overrides.id ?? `test-l${level}-fixture-${counter}`,
    subject: (overrides.subject ?? 'linux') as SubjectId,
    level,
    type: 'mcq',
    title: 'TEST-001: fixture challenge',
    scenario: 'A test scenario long enough to pass validation.',
    prompt: 'Pick the right answer?',
    options: ['a', 'b', 'c'],
    correctIndex: 0,
    explanation: 'Because the first option is correct in this fixture, obviously.',
    fundamental: 'test-concept',
    xp: level === 1 ? 10 : level === 2 ? 20 : level === 3 ? 35 : 50,
    tags: ['test'],
    estMinutes: 2,
    source: 'seed',
    ...overrides,
  } as McqChallenge
}

/** A pool with N mcq challenges per level for one subject */
export function makePool(subject: SubjectId, perLevel = 6): Challenge[] {
  const pool: Challenge[] = []
  for (const level of [1, 2, 3, 4] as ChallengeLevel[]) {
    for (let i = 0; i < perLevel; i++) {
      pool.push(makeMcq({ subject, level, id: `${subject}-l${level}-pool-${i}` }))
    }
  }
  return pool
}

export function freshProgress(): UserProgress {
  return initialProgress('2026-08-01T08:00:00.000Z')
}

/** A Date whose Asia/Jerusalem dayKey is 2026-08-02 (10:00 local, UTC+3) */
export const NOW = new Date('2026-08-02T07:00:00.000Z')
export const TODAY = '2026-08-02'
