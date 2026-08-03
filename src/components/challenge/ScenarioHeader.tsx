import type { Challenge } from '../../types/challenge'
import { LEVEL_NAMES } from '../../types/challenge'
import { SUBJECTS } from '../../content/subjects'
import Chip from '../ui/Chip'

const SEVERITY: Record<number, { label: string; color: string }> = {
  1: { label: 'SEV-4', color: 'var(--c-ok)' },
  2: { label: 'SEV-3', color: 'var(--c-warn)' },
  3: { label: 'SEV-2', color: '#fb923c' },
  4: { label: 'SEV-1', color: 'var(--c-danger)' },
}

export default function ScenarioHeader({ challenge, src }: { challenge: Challenge; src: string }) {
  const subject = SUBJECTS[challenge.subject]
  const [ticket, ...restTitle] = challenge.title.split(': ')
  const hasTicket = restTitle.length > 0
  const sev = SEVERITY[challenge.level]
  return (
    <div className="border-b border-line pb-4">
      <div className="flex flex-wrap items-center gap-2">
        {hasTicket && <span className="mono text-xs font-semibold tracking-wider text-faint">{ticket}</span>}
        <Chip label={sev.label} color={sev.color} />
        <Chip label={subject.short} color={subject.color} />
        <Chip label={`L${challenge.level} · ${LEVEL_NAMES[challenge.level]}`} color="var(--c-muted)" />
        {src === 'review' && <Chip label="Review" color="#c084fc" />}
        {src === 'practice' && <Chip label="Practice" color="var(--c-faint)" />}
        <span className="ml-auto text-xs text-faint">~{challenge.estMinutes} min</span>
      </div>
      <h1 className="mt-3 text-xl font-semibold leading-snug">
        {hasTicket ? restTitle.join(': ') : challenge.title}
      </h1>
    </div>
  )
}
