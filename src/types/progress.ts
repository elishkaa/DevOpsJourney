import type { Challenge, ChallengeLevel, SubjectId } from './challenge'

export type AttemptSource = 'daily' | 'review' | 'practice' | 'placement'

export interface AttemptRecord {
  challengeId: string
  subject: SubjectId
  level: ChallengeLevel
  correct: boolean
  ratingBefore: number
  ratingAfter: number
  xpEarned: number
  timeSec: number
  src: AttemptSource
  /** ISO timestamp */
  at: string
}

export interface SubjectProgress {
  /** 0–1000 */
  rating: number
  /** Level served for NEW challenges — hysteresis lives here */
  workingLevel: ChallengeLevel
  placed: boolean
  attempts: number
  correct: number
  /** Consecutive correct at current working level (promotion gate) */
  correctStreak: number
  wrongStreak: number
  levelPeak: ChallengeLevel
  /** Solved correctly at least once (excluded from the "new" pool) */
  completedIds: string[]
  /** Shown at least once (placement marks seen, not completed) */
  seenIds: string[]
  /** dayKey of last activity in this subject */
  lastPracticedDay: string | null
}

export interface ReviewItem {
  challengeId: string
  subject: SubjectId
  /** = challenge.fundamental */
  concept: string
  /** SM-2 easiness factor, clamped [1.3, 2.8] */
  easiness: number
  intervalDays: number
  repetitions: number
  lapses: number
  /** dayKey (Asia/Jerusalem) */
  dueDay: string
}

export type DailySlotKind = 'cotd' | 'review' | 'new'

export interface DailySlot {
  kind: DailySlotKind
  challengeId: string
  done: boolean
  correct?: boolean
}

export interface DailyCache {
  dayKey: string
  slots: DailySlot[]
}

export interface DayLogEntry {
  done: number
  correct: number
  xp: number
  perfect: boolean
}

export interface StreakState {
  current: number
  best: number
  lastActiveDay: string | null
  /** Auto-consumed to protect a streak; capped at 2 */
  freezeTokens: number
}

export interface UserProgress {
  schemaVersion: 1
  createdAt: string
  xp: number
  streak: StreakState
  subjects: Record<SubjectId, SubjectProgress>
  reviewQueue: ReviewItem[]
  /** badgeId -> earnedAt ISO */
  badges: Record<string, string>
  /** Newest last; capped at 500 */
  history: AttemptRecord[]
  /** dayKey -> aggregates; capped at 400 keys */
  dailyLog: Record<string, DayLogEntry>
  dailyCache: DailyCache | null
  /** AI-generated challenges; capped at 100, oldest evicted */
  customChallenges: Challenge[]
  /** Small named counters used by achievement badges (speedBonuses, spotCorrect, …) */
  counters: Record<string, number>
}

export const SUBJECT_IDS: SubjectId[] = [
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

export function initialSubjectProgress(): SubjectProgress {
  return {
    rating: 125,
    workingLevel: 1,
    placed: false,
    attempts: 0,
    correct: 0,
    correctStreak: 0,
    wrongStreak: 0,
    levelPeak: 1,
    completedIds: [],
    seenIds: [],
    lastPracticedDay: null,
  }
}

export function initialProgress(now = new Date().toISOString()): UserProgress {
  const subjects = {} as Record<SubjectId, SubjectProgress>
  for (const id of SUBJECT_IDS) subjects[id] = initialSubjectProgress()
  return {
    schemaVersion: 1,
    createdAt: now,
    xp: 0,
    streak: { current: 0, best: 0, lastActiveDay: null, freezeTokens: 1 },
    subjects,
    reviewQueue: [],
    badges: {},
    history: [],
    dailyLog: {},
    dailyCache: null,
    customChallenges: [],
    counters: {},
  }
}
