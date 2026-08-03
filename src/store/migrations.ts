import type { UserProgress } from '../types/progress'
import { initialProgress, initialSubjectProgress, SUBJECT_IDS } from '../types/progress'
import type { Settings } from '../types/settings'
import { initialSettings } from '../types/settings'

/**
 * Deep-merge an untrusted/older progress blob onto current defaults so new
 * fields always exist. Also the import path for backups.
 */
export function coerceProgress(raw: unknown): UserProgress {
  const base = initialProgress()
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Partial<UserProgress> & Record<string, unknown>

  const subjects = { ...base.subjects }
  if (r.subjects && typeof r.subjects === 'object') {
    for (const id of SUBJECT_IDS) {
      const s = (r.subjects as Record<string, unknown>)[id]
      if (s && typeof s === 'object') {
        subjects[id] = { ...initialSubjectProgress(), ...(s as object) } as (typeof subjects)[typeof id]
      }
    }
  }

  return {
    ...base,
    ...('createdAt' in r && typeof r.createdAt === 'string' ? { createdAt: r.createdAt } : {}),
    xp: typeof r.xp === 'number' && r.xp >= 0 ? r.xp : base.xp,
    streak: { ...base.streak, ...(typeof r.streak === 'object' && r.streak ? r.streak : {}) },
    subjects,
    reviewQueue: Array.isArray(r.reviewQueue) ? (r.reviewQueue as UserProgress['reviewQueue']) : base.reviewQueue,
    badges: typeof r.badges === 'object' && r.badges ? (r.badges as UserProgress['badges']) : base.badges,
    history: Array.isArray(r.history) ? (r.history as UserProgress['history']) : base.history,
    dailyLog: typeof r.dailyLog === 'object' && r.dailyLog ? (r.dailyLog as UserProgress['dailyLog']) : base.dailyLog,
    dailyCache: (r.dailyCache as UserProgress['dailyCache']) ?? null,
    customChallenges: Array.isArray(r.customChallenges)
      ? (r.customChallenges as UserProgress['customChallenges'])
      : base.customChallenges,
    counters: typeof r.counters === 'object' && r.counters ? (r.counters as UserProgress['counters']) : {},
    schemaVersion: 1,
  }
}

export function coerceSettings(raw: unknown): Settings {
  const base = initialSettings()
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Partial<Settings>
  return {
    ...base,
    ...r,
    schemaVersion: 1,
  }
}

/** zustand persist migrate hooks (persisted shape is { progress } / { settings }) */
export function migratePersistedProgress(persisted: unknown): { progress: UserProgress } {
  const p = (persisted as { progress?: unknown })?.progress
  return { progress: coerceProgress(p) }
}

export function migratePersistedSettings(persisted: unknown): { settings: Settings } {
  const s = (persisted as { settings?: unknown })?.settings
  return { settings: coerceSettings(s) }
}
