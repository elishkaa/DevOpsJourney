import type { Challenge, ChallengeLevel, SubjectId } from '../types/challenge'
import type { DailyCache, DailySlot, UserProgress } from '../types/progress'
import { DAILY_MAX_REVIEWS } from './constants'
import { pickCotd } from './daily'
import { dueItems } from './srs'
import { seededShuffle } from './rng'

/** Ids eligible for the stateless Challenge of the Day: seed bank, non-free, sorted. */
export function cotdPool(seedBank: Challenge[]): string[] {
  return seedBank
    .filter((c) => c.type !== 'free')
    .map((c) => c.id)
    .sort()
}

export function findChallenge(id: string, seedBank: Challenge[], custom: Challenge[]): Challenge | undefined {
  return seedBank.find((c) => c.id === id) ?? custom.find((c) => c.id === id)
}

function playable(c: Challenge, aiEnabled: boolean): boolean {
  return c.type !== 'free' || aiEnabled
}

/** Unseen challenges for a subject at a level (with graceful level fallback) */
function newAtLevel(
  subject: SubjectId,
  level: ChallengeLevel,
  all: Challenge[],
  progress: UserProgress,
  aiEnabled: boolean,
  exclude: Set<string>,
): Challenge[] {
  const sp = progress.subjects[subject]
  const seen = new Set([...sp.seenIds, ...sp.completedIds])
  const pick = (lvl: number) =>
    all.filter(
      (c) =>
        c.subject === subject &&
        c.level === lvl &&
        playable(c, aiEnabled) &&
        !seen.has(c.id) &&
        !exclude.has(c.id),
    )
  for (const lvl of [level, level - 1, level + 1]) {
    if (lvl < 1 || lvl > 4) continue
    const found = pick(lvl)
    if (found.length > 0) return found
  }
  return []
}

/**
 * Build today's frozen slot list:
 *   slot 1 — stateless COTD (matches the daily email),
 *   then up to DAILY_MAX_REVIEWS due reviews,
 *   then new challenges at working level from least-recently-practiced subjects.
 */
export function buildDailySet(
  today: string,
  seedBank: Challenge[],
  progress: UserProgress,
  dailyGoal: number,
  aiEnabled: boolean,
): DailyCache {
  const all = [...seedBank, ...progress.customChallenges]
  const slots: DailySlot[] = []
  const used = new Set<string>()

  // 1 — Challenge of the Day (team-wide incident; may be off-band by design)
  const cotdId = pickCotd(today, cotdPool(seedBank))
  slots.push({ kind: 'cotd', challengeId: cotdId, done: false })
  used.add(cotdId)

  const targetCount = Math.max(1, dailyGoal)

  // 2 — due reviews (earliest due first, seeded tiebreak)
  const due = seededShuffle(dueItems(progress.reviewQueue, today), `reviews:${today}`)
    .sort((a, b) => (a.dueDay < b.dueDay ? -1 : a.dueDay > b.dueDay ? 1 : 0))
    .filter((r) => !used.has(r.challengeId))
    .filter((r) => findChallenge(r.challengeId, seedBank, progress.customChallenges))
    .slice(0, DAILY_MAX_REVIEWS)
  for (const r of due) {
    if (slots.length >= targetCount) break
    slots.push({ kind: 'review', challengeId: r.challengeId, done: false })
    used.add(r.challengeId)
  }

  // 3 — new challenges from least-recently-practiced subjects
  const subjectOrder = seededShuffle(Object.keys(progress.subjects) as SubjectId[], `subjects:${today}`).sort(
    (a, b) => {
      const pa = progress.subjects[a]
      const pb = progress.subjects[b]
      const da = pa.lastPracticedDay ?? ''
      const db = pb.lastPracticedDay ?? ''
      if (da !== db) return da < db ? -1 : 1
      return pa.rating - pb.rating
    },
  )

  let guard = 0
  while (slots.length < targetCount && guard < 40) {
    let added = false
    for (const subject of subjectOrder) {
      if (slots.length >= targetCount) break
      const sp = progress.subjects[subject]
      const candidates = newAtLevel(subject, sp.workingLevel, all, progress, aiEnabled, used)
      if (candidates.length === 0) continue
      const chosen = seededShuffle(candidates, `new:${today}:${subject}:${slots.length}`)[0]
      slots.push({ kind: 'new', challengeId: chosen.id, done: false })
      used.add(chosen.id)
      added = true
    }
    if (!added) break
    guard++
  }

  return { dayKey: today, slots }
}

/** A practice challenge for a subject: prefer unseen at working level, else seen. */
export function pickPractice(
  subject: SubjectId,
  seedBank: Challenge[],
  progress: UserProgress,
  aiEnabled: boolean,
  seedStr: string,
): Challenge | null {
  const all = [...seedBank, ...progress.customChallenges]
  const sp = progress.subjects[subject]
  const fresh = newAtLevel(subject, sp.workingLevel, all, progress, aiEnabled, new Set())
  if (fresh.length > 0) return seededShuffle(fresh, seedStr)[0]

  const anyAtLevel = (lvl: number) =>
    all.filter((c) => c.subject === subject && c.level === lvl && playable(c, aiEnabled))
  for (const lvl of [sp.workingLevel, sp.workingLevel - 1, sp.workingLevel + 1]) {
    if (lvl < 1 || lvl > 4) continue
    const found = anyAtLevel(lvl)
    if (found.length > 0) return seededShuffle(found, seedStr)[0]
  }
  return null
}
