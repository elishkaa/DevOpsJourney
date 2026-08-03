import type { AttemptOutcome } from '../../engine/applyAttempt'
import type { Challenge } from '../../types/challenge'
import MiniMarkdown from '../ui/MiniMarkdown'

function RatingDelta({ delta }: { delta: number }) {
  if (delta === 0) return null
  const up = delta > 0
  return (
    <span className={`mono inline-flex items-center gap-1 text-sm font-semibold ${up ? 'text-ok' : 'text-danger'}`}>
      {up ? '▲' : '▼'} {up ? '+' : ''}
      {Math.round(delta)} rating
    </span>
  )
}

interface Props {
  challenge: Challenge
  outcome: AttemptOutcome
  mentorSlot?: React.ReactNode
}

export default function ResultPanel({ challenge, outcome, mentorSlot }: Props) {
  const { correct } = outcome
  return (
    <div className="dj-rise mt-6 space-y-4">
      <div
        className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border p-4 ${
          correct ? 'border-ok/50 bg-ok-soft' : 'border-danger/50 bg-danger-soft'
        }`}
      >
        <span className={`text-lg font-bold ${correct ? 'text-ok' : 'text-danger'}`}>
          {correct ? 'Incident resolved ✓' : 'Not this time'}
        </span>
        <span className="mono text-sm font-semibold text-gold">+{outcome.xpEarned} XP</span>
        {outcome.speedBonus > 0 && (
          <span className="mono text-xs text-gold">⚡ speed bonus +{outcome.speedBonus}</span>
        )}
        <RatingDelta delta={outcome.ratingDelta} />
        {outcome.reviewScheduled && (
          <span className="text-xs text-muted">→ scheduled for review tomorrow</span>
        )}
        {outcome.reviewRetired && (
          <span className="text-xs text-ok">concept mastered — retired from reviews 🎓</span>
        )}
      </div>

      <div className="card p-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">The fundamental</span>
          <span className="mono rounded bg-raised px-1.5 py-0.5 text-[11px] text-muted">
            {challenge.fundamental}
          </span>
        </div>
        <MiniMarkdown text={challenge.explanation} className="text-sm text-ink/90" />
      </div>

      {mentorSlot}
    </div>
  )
}
