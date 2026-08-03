import { useEffect } from 'react'
import { SEED_BANK } from '../content'
import { dayKey } from '../engine/daily'
import { findChallenge } from '../engine/selector'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import type { Challenge } from '../types/challenge'
import type { DailySlot } from '../types/progress'

export interface ResolvedSlot extends DailySlot {
  challenge: Challenge
}

/** Builds (once per day) and returns today's frozen challenge slots. */
export function useDailySet(): { slots: ResolvedSlot[]; today: string } {
  const progress = useProgressStore((s) => s.progress)
  const ensureDailySet = useProgressStore((s) => s.ensureDailySet)
  const settings = useSettingsStore((s) => s.settings)
  const aiEnabled = Boolean(settings.anthropicApiKey)
  const today = dayKey(new Date())

  useEffect(() => {
    ensureDailySet(SEED_BANK, settings.dailyGoal, aiEnabled)
  }, [ensureDailySet, today, settings.dailyGoal, aiEnabled])

  const cache = progress.dailyCache
  if (!cache || cache.dayKey !== today) return { slots: [], today }

  const slots = cache.slots
    .map((slot) => {
      const challenge = findChallenge(slot.challengeId, SEED_BANK, progress.customChallenges)
      return challenge ? { ...slot, challenge } : null
    })
    .filter((s): s is ResolvedSlot => s !== null)

  return { slots, today }
}

/** The id of the next undone slot after the given challenge id (or null). */
export function nextUndoneSlot(slots: ResolvedSlot[], afterChallengeId: string): ResolvedSlot | null {
  const undone = slots.filter((s) => !s.done && s.challengeId !== afterChallengeId)
  return undone[0] ?? null
}
