import type { Challenge, ChallengeLevel } from '../types/challenge'
import type { AttemptRecord, AttemptSource, UserProgress } from '../types/progress'
import { DAILY_ALL_DONE_BONUS, DAILY_LOG_CAP, HISTORY_CAP, PERFECT_DAY_BONUS, REVIEW_RETIRE_BONUS } from './constants'
import { dayKey } from './daily'
import type { Graded } from './grading'
import { applyRatingUpdate, nextWorkingLevel } from './rating'
import { onMiss, onReview, reviewQuality } from './srs'
import { advanceStreak, type StreakEvent } from './streak'
import { evaluateBadges } from './badges'
import { levelForXp, xpForAttempt } from './xp'

export interface AttemptCtx {
  now: Date
  src: AttemptSource
  timeSec: number
}

export interface AttemptOutcome {
  correct: boolean
  xpEarned: number
  speedBonus: number
  ratingDelta: number
  newBadges: string[]
  promotedTo: ChallengeLevel | null
  demotedTo: ChallengeLevel | null
  streakEvent: StreakEvent
  streakMilestone: number | null
  streakCurrent: number
  reviewScheduled: boolean
  reviewRetired: boolean
  dailyAllDone: boolean
  perfectDay: boolean
  overallLevelUp: { from: number; to: number } | null
}

/**
 * THE integration function: applies one graded attempt to the whole progress
 * state. Pure — returns a new UserProgress plus an outcome summary for the UI.
 * Placement attempts are handled by the placement flow, not here.
 */
export function applyAttempt(
  progress: UserProgress,
  challenge: Challenge,
  graded: Graded,
  ctx: AttemptCtx,
): { progress: UserProgress; outcome: AttemptOutcome } {
  const today = dayKey(ctx.now)
  const correct = graded.correct
  const levelBefore = levelForXp(progress.xp)

  const sp = progress.subjects[challenge.subject]
  const preWrongStreak = sp.wrongStreak

  // ---- rating (skipped for practice; halved evidence for reviews) ----
  let rating = sp.rating
  let ratingDelta = 0
  if (ctx.src !== 'practice') {
    const upd = applyRatingUpdate(sp.rating, sp.attempts, challenge.level, graded.score, {
      isReview: ctx.src === 'review',
    })
    rating = upd.rating
    ratingDelta = upd.delta
  }

  // ---- subject stats ----
  const correctStreak = correct
    ? challenge.level >= sp.workingLevel
      ? sp.correctStreak + 1
      : sp.correctStreak
    : 0
  const wrongStreak = correct ? 0 : sp.wrongStreak + 1

  let nextSp = {
    ...sp,
    rating,
    attempts: sp.attempts + 1,
    correct: sp.correct + (correct ? 1 : 0),
    correctStreak,
    wrongStreak,
    seenIds: sp.seenIds.includes(challenge.id) ? sp.seenIds : [...sp.seenIds, challenge.id],
    completedIds:
      correct && !sp.completedIds.includes(challenge.id)
        ? [...sp.completedIds, challenge.id]
        : sp.completedIds,
    lastPracticedDay: today,
  }

  // ---- working level transition (hysteresis) ----
  const transition = nextWorkingLevel(nextSp)
  const promoted = transition.promoted
  const demoted = transition.demoted
  nextSp = {
    ...nextSp,
    workingLevel: transition.workingLevel,
    correctStreak: promoted ? 0 : nextSp.correctStreak,
    levelPeak: Math.max(nextSp.levelPeak, transition.workingLevel) as ChallengeLevel,
  }

  // ---- streak ----
  const streakUpd = advanceStreak(progress.streak, today)

  // ---- XP ----
  const xpB = xpForAttempt(challenge, correct, ctx.timeSec, ctx.src, streakUpd.streak.current)
  let xpEarned = xpB.xp

  // ---- SRS ----
  let reviewQueue = progress.reviewQueue
  let reviewScheduled = false
  let reviewRetired = false
  if (ctx.src === 'review') {
    const q = reviewQuality(correct, ctx.timeSec, challenge.estMinutes)
    const res = onReview(reviewQueue, challenge.id, q, today)
    reviewQueue = res.queue
    reviewRetired = res.retired
    if (res.retired) xpEarned += REVIEW_RETIRE_BONUS
  } else if (!correct) {
    reviewQueue = onMiss(reviewQueue, challenge, today)
    reviewScheduled = true
  }

  // ---- daily cache slot + daily bonuses ----
  let dailyCache = progress.dailyCache
  let dailyAllDone = false
  let perfectDay = false
  if (dailyCache && dailyCache.dayKey === today && (ctx.src === 'daily' || ctx.src === 'review')) {
    const idx = dailyCache.slots.findIndex((s) => s.challengeId === challenge.id && !s.done)
    if (idx >= 0) {
      const wasAllDone = dailyCache.slots.every((s) => s.done)
      const slots = dailyCache.slots.map((s, i) => (i === idx ? { ...s, done: true, correct } : s))
      dailyCache = { ...dailyCache, slots }
      const nowAllDone = slots.every((s) => s.done)
      if (!wasAllDone && nowAllDone) {
        dailyAllDone = true
        xpEarned += DAILY_ALL_DONE_BONUS
        if (slots.every((s) => s.correct)) {
          perfectDay = true
          xpEarned += PERFECT_DAY_BONUS
        }
      }
    }
  }

  // ---- daily log ----
  const prevLog = progress.dailyLog[today] ?? { done: 0, correct: 0, xp: 0, perfect: false }
  let dailyLog: UserProgress['dailyLog'] = {
    ...progress.dailyLog,
    [today]: {
      done: prevLog.done + 1,
      correct: prevLog.correct + (correct ? 1 : 0),
      xp: prevLog.xp + xpEarned,
      perfect: prevLog.perfect || perfectDay,
    },
  }
  const logKeys = Object.keys(dailyLog).sort()
  if (logKeys.length > DAILY_LOG_CAP) {
    const keep = new Set(logKeys.slice(-DAILY_LOG_CAP))
    dailyLog = Object.fromEntries(Object.entries(dailyLog).filter(([k]) => keep.has(k)))
  }

  // ---- counters (badge fuel) ----
  const counters = { ...progress.counters }
  const bump = (k: string, by = 1) => (counters[k] = (counters[k] ?? 0) + by)
  if (correct && xpB.speedBonus > 0) bump('speedBonuses')
  if (correct && challenge.type === 'spot') bump('spotCorrect')
  if (correct && challenge.type === 'command') bump('commandCorrect')
  if (correct && preWrongStreak >= 3) bump('comebacks')
  if (correct && ctx.now.getHours() < 8) bump('earlyBird')
  if (reviewRetired) bump('retired')

  // ---- history ----
  const record: AttemptRecord = {
    challengeId: challenge.id,
    subject: challenge.subject,
    level: challenge.level,
    correct,
    ratingBefore: sp.rating,
    ratingAfter: rating,
    xpEarned,
    timeSec: ctx.timeSec,
    src: ctx.src,
    at: ctx.now.toISOString(),
  }
  const history = [...progress.history, record].slice(-HISTORY_CAP)

  // ---- assemble + badges ----
  let next: UserProgress = {
    ...progress,
    xp: progress.xp + xpEarned,
    streak: streakUpd.streak,
    subjects: { ...progress.subjects, [challenge.subject]: nextSp },
    reviewQueue,
    dailyCache,
    dailyLog,
    counters,
    history,
  }

  const newBadges = evaluateBadges(next)
  if (newBadges.length > 0) {
    const at = ctx.now.toISOString()
    next = { ...next, badges: { ...next.badges, ...Object.fromEntries(newBadges.map((b) => [b, at])) } }
  }

  const levelAfter = levelForXp(next.xp)

  return {
    progress: next,
    outcome: {
      correct,
      xpEarned,
      speedBonus: xpB.speedBonus,
      ratingDelta,
      newBadges,
      promotedTo: promoted ? nextSp.workingLevel : null,
      demotedTo: demoted ? nextSp.workingLevel : null,
      streakEvent: streakUpd.event,
      streakMilestone: streakUpd.milestone,
      streakCurrent: streakUpd.streak.current,
      reviewScheduled,
      reviewRetired,
      dailyAllDone,
      perfectDay,
      overallLevelUp: levelAfter > levelBefore ? { from: levelBefore, to: levelAfter } : null,
    },
  }
}
