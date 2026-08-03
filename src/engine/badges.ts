import type { SubjectId } from '../types/challenge'
import type { UserProgress } from '../types/progress'
import { SUBJECT_IDS } from '../types/progress'
import { shiftDayKey } from './daily'

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface BadgeDef {
  id: string
  kind: 'subject' | 'achievement'
  subject?: SubjectId
  tier?: BadgeTier
  /** For achievements; subject badges compose their name in the UI */
  name: string
  description: string
  check: (p: UserProgress) => boolean
}

const TIER_REQ: Record<BadgeTier, (p: UserProgress, s: SubjectId) => boolean> = {
  bronze: (p, s) => p.subjects[s].levelPeak >= 2,
  silver: (p, s) => p.subjects[s].levelPeak >= 3,
  gold: (p, s) => p.subjects[s].levelPeak >= 4,
  platinum: (p, s) => p.subjects[s].rating >= 900,
}

const TIER_LABEL: Record<BadgeTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
}

const TIER_DESC: Record<BadgeTier, string> = {
  bronze: 'Reached Operator level',
  silver: 'Reached Engineer level',
  gold: 'Reached Architect level',
  platinum: 'Rating 900+ — elite territory',
}

function subjectBadges(): BadgeDef[] {
  const defs: BadgeDef[] = []
  for (const s of SUBJECT_IDS) {
    for (const tier of ['bronze', 'silver', 'gold', 'platinum'] as BadgeTier[]) {
      defs.push({
        id: `subj_${s}_${tier}`,
        kind: 'subject',
        subject: s,
        tier,
        name: TIER_LABEL[tier],
        description: TIER_DESC[tier],
        check: (p) => TIER_REQ[tier](p, s),
      })
    }
  }
  return defs
}

function totalAttempts(p: UserProgress): number {
  return Object.values(p.subjects).reduce((n, s) => n + s.attempts, 0)
}
function totalCorrect(p: UserProgress): number {
  return Object.values(p.subjects).reduce((n, s) => n + s.correct, 0)
}
function perfectRun(p: UserProgress, days: number): boolean {
  const keys = Object.keys(p.dailyLog).sort()
  if (keys.length === 0) return false
  const last = keys[keys.length - 1]
  for (let i = 0; i < days; i++) {
    const k = shiftDayKey(last, -i)
    if (!p.dailyLog[k]?.perfect) return false
  }
  return true
}

const ACHIEVEMENTS: BadgeDef[] = [
  { id: 'ach_first_blood', kind: 'achievement', name: 'First Blood', description: 'First challenge solved', check: (p) => totalCorrect(p) >= 1 },
  { id: 'ach_calibrated', kind: 'achievement', name: 'Calibrated', description: 'Completed your first placement quiz', check: (p) => Object.values(p.subjects).some((s) => s.placed) },
  { id: 'ach_polyglot', kind: 'achievement', name: 'Polyglot', description: 'Placed in all 10 subjects', check: (p) => Object.values(p.subjects).every((s) => s.placed) },
  { id: 'ach_streak_3', kind: 'achievement', name: 'Warming Up', description: '3-day streak', check: (p) => p.streak.best >= 3 },
  { id: 'ach_streak_7', kind: 'achievement', name: 'On Fire', description: '7-day streak', check: (p) => p.streak.best >= 7 },
  { id: 'ach_streak_14', kind: 'achievement', name: 'Unstoppable', description: '14-day streak', check: (p) => p.streak.best >= 14 },
  { id: 'ach_streak_30', kind: 'achievement', name: 'Iron Habit', description: '30-day streak', check: (p) => p.streak.best >= 30 },
  { id: 'ach_comeback', kind: 'achievement', name: 'Comeback Kid', description: 'Bounced back right after 3 straight misses', check: (p) => (p.counters.comebacks ?? 0) >= 1 },
  { id: 'ach_perfect_day', kind: 'achievement', name: 'Perfect Day', description: 'Finished all daily slots with zero misses', check: (p) => Object.values(p.dailyLog).some((d) => d.perfect) },
  { id: 'ach_perfect_week', kind: 'achievement', name: 'Perfect Week', description: '7 consecutive perfect days', check: (p) => perfectRun(p, 7) },
  { id: 'ach_speedrunner', kind: 'achievement', name: 'Speedrunner', description: '10 speed bonuses earned', check: (p) => (p.counters.speedBonuses ?? 0) >= 10 },
  { id: 'ach_bug_hunter', kind: 'achievement', name: 'Bug Hunter', description: '10 spot-the-bug challenges solved', check: (p) => (p.counters.spotCorrect ?? 0) >= 10 },
  { id: 'ach_shell_samurai', kind: 'achievement', name: 'Shell Samurai', description: '10 command challenges typed correctly', check: (p) => (p.counters.commandCorrect ?? 0) >= 10 },
  { id: 'ach_scholar', kind: 'achievement', name: 'Scholar', description: 'Retired 10 review concepts for good', check: (p) => (p.counters.retired ?? 0) >= 10 },
  { id: 'ach_early_bird', kind: 'achievement', name: 'Early Bird', description: 'Solved a challenge before 08:00', check: (p) => (p.counters.earlyBird ?? 0) >= 1 },
  { id: 'ach_centurion', kind: 'achievement', name: 'Centurion', description: '100 challenges attempted', check: (p) => totalAttempts(p) >= 100 },
  { id: 'ach_architect', kind: 'achievement', name: 'The Architect', description: 'Reached Architect level in any subject', check: (p) => Object.values(p.subjects).some((s) => s.levelPeak >= 4) },
]

export const ALL_BADGES: BadgeDef[] = [...subjectBadges(), ...ACHIEVEMENTS]

export const BADGE_BY_ID: Record<string, BadgeDef> = Object.fromEntries(ALL_BADGES.map((b) => [b.id, b]))

/** Ids of badges newly earned by the given progress state (never revokes). */
export function evaluateBadges(p: UserProgress): string[] {
  const earned: string[] = []
  for (const def of ALL_BADGES) {
    if (p.badges[def.id]) continue
    if (def.check(p)) earned.push(def.id)
  }
  return earned
}
