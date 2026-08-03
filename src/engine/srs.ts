import type { Challenge } from '../types/challenge'
import type { ReviewItem } from '../types/progress'
import { SRS_LAPSE_EF_PENALTY, SRS_MAX_EF, SRS_MIN_EF, SRS_RETIRE_REPS, SRS_START_EF } from './constants'
import { shiftDayKey } from './daily'

function clampEf(ef: number): number {
  return Math.max(SRS_MIN_EF, Math.min(SRS_MAX_EF, ef))
}

/** A miss on a non-review challenge creates (or resets) a review item due tomorrow. */
export function onMiss(queue: ReviewItem[], challenge: Challenge, today: string): ReviewItem[] {
  const existing = queue.find((r) => r.challengeId === challenge.id)
  if (existing) {
    return queue.map((r) =>
      r.challengeId === challenge.id
        ? {
            ...r,
            repetitions: 0,
            intervalDays: 1,
            easiness: clampEf(r.easiness - SRS_LAPSE_EF_PENALTY),
            lapses: r.lapses + 1,
            dueDay: shiftDayKey(today, 1),
          }
        : r,
    )
  }
  return [
    ...queue,
    {
      challengeId: challenge.id,
      subject: challenge.subject,
      concept: challenge.fundamental,
      easiness: SRS_START_EF,
      intervalDays: 1,
      repetitions: 0,
      lapses: 0,
      dueDay: shiftDayKey(today, 1),
    },
  ]
}

export interface ReviewResult {
  queue: ReviewItem[]
  retired: boolean
}

/**
 * SM-2 lite. quality: 5 = correct & fast, 4 = correct, 2 = wrong.
 * Retires (removes) an item after SRS_RETIRE_REPS successful repetitions.
 */
export function onReview(queue: ReviewItem[], challengeId: string, quality: 2 | 4 | 5, today: string): ReviewResult {
  const item = queue.find((r) => r.challengeId === challengeId)
  if (!item) return { queue, retired: false }

  if (quality < 3) {
    const next = {
      ...item,
      repetitions: 0,
      intervalDays: 1,
      easiness: clampEf(item.easiness - SRS_LAPSE_EF_PENALTY),
      lapses: item.lapses + 1,
      dueDay: shiftDayKey(today, 1),
    }
    return { queue: queue.map((r) => (r.challengeId === challengeId ? next : r)), retired: false }
  }

  const repetitions = item.repetitions + 1
  if (repetitions >= SRS_RETIRE_REPS) {
    return { queue: queue.filter((r) => r.challengeId !== challengeId), retired: true }
  }
  const intervalDays =
    repetitions === 1 ? 1 : repetitions === 2 ? 3 : Math.round(item.intervalDays * item.easiness)
  const easiness = clampEf(item.easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
  const next = { ...item, repetitions, intervalDays, easiness, dueDay: shiftDayKey(today, intervalDays) }
  return { queue: queue.map((r) => (r.challengeId === challengeId ? next : r)), retired: false }
}

export function dueItems(queue: ReviewItem[], today: string): ReviewItem[] {
  return queue.filter((r) => r.dueDay <= today)
}

/** Quality from a graded review attempt */
export function reviewQuality(correct: boolean, timeSec: number, estMinutes: number): 2 | 4 | 5 {
  if (!correct) return 2
  return timeSec <= 60 * estMinutes ? 5 : 4
}
