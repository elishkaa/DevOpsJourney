import { Link } from 'react-router-dom'
import type { ResolvedSlot } from '../../hooks/useDailySet'
import { SUBJECTS } from '../../content/subjects'
import { LEVEL_NAMES } from '../../types/challenge'
import Chip from '../ui/Chip'

const KIND_LABEL: Record<ResolvedSlot['kind'], string> = {
  cotd: 'Incident of the day',
  review: 'Review',
  new: 'New challenge',
}

function SlotCard({ slot }: { slot: ResolvedSlot }) {
  const c = slot.challenge
  const meta = SUBJECTS[c.subject]
  const src = slot.kind === 'review' ? 'review' : 'daily'
  const isCotd = slot.kind === 'cotd'

  const inner = (
    <div
      className={`card relative flex items-center gap-4 p-4 transition-all ${
        slot.done ? 'opacity-70' : 'hover:border-line-strong hover:bg-raised'
      } ${isCotd && !slot.done ? 'border-brand/50' : ''}`}
    >
      {isCotd && !slot.done && (
        <span className="absolute -top-2.5 left-4 rounded-full border border-brand/50 bg-base px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
          🚨 team-wide
        </span>
      )}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
          slot.done ? (slot.correct ? 'bg-ok-soft' : 'bg-danger-soft') : 'bg-raised'
        }`}
      >
        {slot.done ? (slot.correct ? '✓' : '✗') : slot.kind === 'review' ? '↻' : '▸'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-faint">
          <span className="font-semibold uppercase tracking-wider">{KIND_LABEL[slot.kind]}</span>
          <Chip label={meta.short} color={meta.color} />
          <span>L{c.level} · {LEVEL_NAMES[c.level]}</span>
          <span>~{c.estMinutes}m</span>
        </div>
        <p className={`mt-1 truncate text-sm font-medium ${slot.done ? 'line-through' : ''}`}>{c.title}</p>
      </div>
      {!slot.done && <span className="shrink-0 text-muted">→</span>}
    </div>
  )

  return slot.done ? inner : <Link to={`/challenge/${c.id}?src=${src}`}>{inner}</Link>
}

export default function TodayPanel({ slots }: { slots: ResolvedSlot[] }) {
  const done = slots.filter((s) => s.done).length
  const allDone = slots.length > 0 && done === slots.length
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Today’s shift</h2>
        <span className="mono text-xs text-muted">
          {done}/{slots.length} handled
        </span>
      </div>
      <div className="space-y-3">
        {slots.map((slot) => (
          <SlotCard key={slot.challengeId} slot={slot} />
        ))}
      </div>
      {allDone && (
        <div className="dj-rise mt-4 rounded-xl border border-ok/40 bg-ok-soft p-4 text-sm">
          <p className="font-semibold text-ok">Shift complete. The pager is quiet — because of you. 🎉</p>
          <p className="mt-1 text-muted">
            Come back tomorrow for a fresh incident, or{' '}
            <Link to="/subjects" className="text-brand hover:underline">
              practice a subject
            </Link>{' '}
            for extra XP.
          </p>
        </div>
      )}
    </section>
  )
}
