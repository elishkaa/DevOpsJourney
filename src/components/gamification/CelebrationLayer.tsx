import { useEffect, useState } from 'react'
import type { AttemptOutcome } from '../../engine/applyAttempt'
import { BADGE_BY_ID } from '../../engine/badges'
import { LEVEL_NAMES } from '../../types/challenge'
import { SUBJECTS } from '../../content/subjects'
import { rankTitle } from '../../engine/xp'
import { burst } from '../../hooks/useConfetti'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import BadgeSVG from './BadgeSVG'
import AchievementIcon from './AchievementIcon'

type Moment =
  | { kind: 'badge'; badgeId: string }
  | { kind: 'levelup'; from: number; to: number }
  | { kind: 'promotion'; subject: string; to: 1 | 2 | 3 | 4 }
  | { kind: 'streak'; days: number }

/** Queues celebration modals for an attempt outcome, biggest news first. */
export default function CelebrationLayer({ outcome }: { outcome: AttemptOutcome }) {
  const [queue, setQueue] = useState<Moment[]>([])
  const [fired, setFired] = useState(false)

  useEffect(() => {
    if (fired) return
    setFired(true)
    const moments: Moment[] = []
    if (outcome.overallLevelUp) moments.push({ kind: 'levelup', ...outcome.overallLevelUp })
    if (outcome.promotedTo) {
      // subject is not in the outcome; the badge id carries it when a tier badge landed.
      const subjBadge = outcome.newBadges.find((b) => b.startsWith('subj_'))
      const subject = subjBadge?.split('_')[1]
      moments.push({ kind: 'promotion', subject: subject ?? '', to: outcome.promotedTo })
    }
    for (const b of outcome.newBadges) moments.push({ kind: 'badge', badgeId: b })
    if (outcome.streakMilestone) moments.push({ kind: 'streak', days: outcome.streakMilestone })
    if (moments.length > 0) {
      burst(moments.some((m) => m.kind === 'levelup' || m.kind === 'promotion') ? 'fireworks' : 'big')
      setQueue(moments)
    }
  }, [outcome, fired])

  const current = queue[0]
  if (!current) return null
  const dismiss = () => setQueue((q) => q.slice(1))

  return (
    <Modal open onClose={dismiss} className="text-center">
      {current.kind === 'levelup' && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Level up!</p>
          <p className="mt-3 text-5xl font-bold">{current.to}</p>
          <p className="mt-2 text-lg font-medium">{rankTitle(current.to)}</p>
          <p className="mt-1 text-sm text-muted">
            {rankTitle(current.from) === rankTitle(current.to)
              ? `Level ${current.from} → ${current.to}`
              : `You outgrew “${rankTitle(current.from)}”`}
          </p>
        </div>
      )}
      {current.kind === 'promotion' && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">Promotion</p>
          <p className="mt-3 text-2xl font-bold">
            {current.subject && SUBJECTS[current.subject as keyof typeof SUBJECTS]
              ? SUBJECTS[current.subject as keyof typeof SUBJECTS].name
              : 'Subject'}{' '}
            → {LEVEL_NAMES[current.to]}
          </p>
          <p className="mt-2 text-sm text-muted">
            The daily challenges in this subject just got harder. As they should.
          </p>
        </div>
      )}
      {current.kind === 'badge' && <BadgeMoment badgeId={current.badgeId} />}
      {current.kind === 'streak' && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Streak milestone</p>
          <p className="mt-3 text-5xl">🔥</p>
          <p className="mt-2 text-2xl font-bold">{current.days} days</p>
          <p className="mt-1 text-sm text-muted">Consistency is the real superpower.</p>
        </div>
      )}
      <Button className="mt-6" onClick={dismiss}>
        {queue.length > 1 ? `Next (${queue.length - 1} more)` : 'Continue'}
      </Button>
    </Modal>
  )
}

function BadgeMoment({ badgeId }: { badgeId: string }) {
  const def = BADGE_BY_ID[badgeId]
  if (!def) return null
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-gold">Badge earned</p>
      <div className="mt-4 flex justify-center">
        {def.kind === 'subject' && def.subject && def.tier ? (
          <BadgeSVG subject={def.subject} tier={def.tier} earned size={110} />
        ) : (
          <AchievementIcon id={badgeId} earned size={64} />
        )}
      </div>
      <p className="mt-3 text-xl font-bold">
        {def.kind === 'subject' && def.subject ? `${SUBJECTS[def.subject].name} — ${def.name}` : def.name}
      </p>
      <p className="mt-1 text-sm text-muted">{def.description}</p>
    </div>
  )
}
