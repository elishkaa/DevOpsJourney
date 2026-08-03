import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Challenge, SubjectId } from '../types/challenge'
import type { AttemptRecord, AttemptSource, UserProgress } from '../types/progress'
import { initialProgress } from '../types/progress'
import { applyAttempt, type AttemptOutcome } from '../engine/applyAttempt'
import { CUSTOM_CHALLENGE_CAP, PLACEMENT_SKIP_RATING, PLACEMENT_XP_BONUS, PLACEMENT_XP_PER_QUESTION } from '../engine/constants'
import { dayKey } from '../engine/daily'
import type { Graded } from '../engine/grading'
import { bandOf } from '../engine/rating'
import { buildDailySet } from '../engine/selector'
import { evaluateBadges } from '../engine/badges'
import { coerceProgress, migratePersistedProgress } from './migrations'

interface ProgressState {
  progress: UserProgress
  /** Apply a graded attempt; returns the outcome for celebration UI. */
  submitAnswer: (challenge: Challenge, graded: Graded, src: AttemptSource, timeSec: number) => AttemptOutcome
  /** Ensure today's slot list exists (rebuilds when the day changed). */
  ensureDailySet: (seedBank: Challenge[], dailyGoal: number, aiEnabled: boolean) => void
  /** Record one placement question (flat XP, marks seen, logs history). */
  recordPlacementAttempt: (challenge: Challenge, correct: boolean, timeSec: number) => void
  /** Finish placement with the engine-computed final rating. */
  finishPlacement: (subject: SubjectId, rating: number) => void
  skipPlacement: (subject: SubjectId) => void
  addCustomChallenges: (list: Challenge[]) => void
  importProgress: (raw: unknown) => void
  resetAll: () => void
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: initialProgress(),

      submitAnswer: (challenge, graded, src, timeSec) => {
        const { progress } = get()
        const res = applyAttempt(progress, challenge, graded, { now: new Date(), src, timeSec })
        set({ progress: res.progress })
        return res.outcome
      },

      ensureDailySet: (seedBank, dailyGoal, aiEnabled) => {
        const { progress } = get()
        const today = dayKey(new Date())
        if (progress.dailyCache?.dayKey === today) return
        const dailyCache = buildDailySet(today, seedBank, progress, dailyGoal, aiEnabled)
        set({ progress: { ...progress, dailyCache } })
      },

      recordPlacementAttempt: (challenge, correct, timeSec) => {
        const { progress } = get()
        const sp = progress.subjects[challenge.subject]
        const record: AttemptRecord = {
          challengeId: challenge.id,
          subject: challenge.subject,
          level: challenge.level,
          correct,
          ratingBefore: sp.rating,
          ratingAfter: sp.rating,
          xpEarned: PLACEMENT_XP_PER_QUESTION,
          timeSec,
          src: 'placement',
          at: new Date().toISOString(),
        }
        set({
          progress: {
            ...progress,
            xp: progress.xp + PLACEMENT_XP_PER_QUESTION,
            subjects: {
              ...progress.subjects,
              [challenge.subject]: {
                ...sp,
                seenIds: sp.seenIds.includes(challenge.id) ? sp.seenIds : [...sp.seenIds, challenge.id],
              },
            },
            history: [...progress.history, record].slice(-500),
          },
        })
      },

      finishPlacement: (subject, rating) => {
        const { progress } = get()
        const sp = progress.subjects[subject]
        const workingLevel = bandOf(rating)
        let next: UserProgress = {
          ...progress,
          xp: progress.xp + PLACEMENT_XP_BONUS,
          subjects: {
            ...progress.subjects,
            [subject]: {
              ...sp,
              rating,
              workingLevel,
              levelPeak: Math.max(sp.levelPeak, workingLevel) as typeof sp.levelPeak,
              placed: true,
            },
          },
        }
        const newBadges = evaluateBadges(next)
        if (newBadges.length > 0) {
          const at = new Date().toISOString()
          next = { ...next, badges: { ...next.badges, ...Object.fromEntries(newBadges.map((b) => [b, at])) } }
        }
        set({ progress: next })
      },

      skipPlacement: (subject) => {
        const { progress } = get()
        const sp = progress.subjects[subject]
        set({
          progress: {
            ...progress,
            subjects: {
              ...progress.subjects,
              [subject]: { ...sp, rating: PLACEMENT_SKIP_RATING, workingLevel: 1, placed: true },
            },
          },
        })
      },

      addCustomChallenges: (list) => {
        const { progress } = get()
        const existing = new Set([...progress.customChallenges.map((c) => c.id)])
        const fresh = list.filter((c) => !existing.has(c.id))
        const merged = [...progress.customChallenges, ...fresh].slice(-CUSTOM_CHALLENGE_CAP)
        set({ progress: { ...progress, customChallenges: merged } })
      },

      importProgress: (raw) => set({ progress: coerceProgress(raw) }),

      resetAll: () => set({ progress: initialProgress() }),
    }),
    {
      name: 'dj.progress',
      version: 1,
      partialize: (s) => ({ progress: s.progress }),
      migrate: (persisted) => migratePersistedProgress(persisted) as never,
    },
  ),
)
