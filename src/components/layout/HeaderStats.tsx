import { Link } from 'react-router-dom'
import { useProgressStore } from '../../store/progressStore'
import { levelForXp } from '../../engine/xp'
import { dayKey } from '../../engine/daily'
import { FlameSVG } from '../dashboard/StreakFlame'

/** Compact streak + level indicator in the top bar. */
export default function HeaderStats() {
  const streak = useProgressStore((s) => s.progress.streak)
  const xp = useProgressStore((s) => s.progress.xp)
  const activeToday = streak.lastActiveDay === dayKey(new Date())
  return (
    <Link to="/" className="flex items-center gap-3">
      <span className="flex items-center gap-1" title={`${streak.current}-day streak`}>
        <FlameSVG size={20} lit={streak.current > 0 && activeToday} />
        <span className="mono text-sm font-semibold">{streak.current}</span>
      </span>
      <span
        className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-brand-soft px-1.5 text-xs font-bold text-brand"
        title={`Level ${levelForXp(xp)} · ${xp} XP`}
      >
        {levelForXp(xp)}
      </span>
    </Link>
  )
}
