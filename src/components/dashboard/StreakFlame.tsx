import { useProgressStore } from '../../store/progressStore'
import { dayKey } from '../../engine/daily'
import { streakAtRisk } from '../../engine/streak'

export function FlameSVG({ size = 40, lit }: { size?: number; lit: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={lit ? 'dj-flame' : 'opacity-35 grayscale'}>
      <defs>
        <linearGradient id="flame-g" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="0.6" stopColor="#fb923c" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <path
        d="M12 2c1 3.5-2.5 5-2.5 8a2.5 2.5 0 0 0 5 .2C16.5 11.5 19 13 19 16a7 7 0 0 1-14 0c0-3 1.6-4.6 3-6 .3 1.2 1 2 2 2.4C9.4 8 9 4.5 12 2z"
        fill="url(#flame-g)"
      />
      <path d="M12 21.5A3.5 3.5 0 0 1 8.5 18c0-2 1.8-3 3.5-5 1.7 2 3.5 3 3.5 5a3.5 3.5 0 0 1-3.5 3.5z" fill="#fde68a" />
    </svg>
  )
}

export default function StreakFlame() {
  const streak = useProgressStore((s) => s.progress.streak)
  const today = dayKey(new Date())
  const activeToday = streak.lastActiveDay === today
  const atRisk = streakAtRisk(streak, today)
  return (
    <div className="card flex items-center gap-4 p-4">
      <FlameSVG size={44} lit={streak.current > 0 && (activeToday || atRisk)} />
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{streak.current}</span>
          <span className="text-sm text-muted">day streak</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
          <span>best {streak.best}</span>
          <span aria-hidden>·</span>
          <span title="Streak freezes — each auto-covers one missed day">
            {'❄'.repeat(streak.freezeTokens) || 'no freezes'}
          </span>
        </div>
        {atRisk && (
          <p className="mt-1 text-xs font-medium text-warn">Solve one challenge today to keep the flame alive!</p>
        )}
        {activeToday && streak.current > 0 && <p className="mt-1 text-xs text-ok">Today is banked ✓</p>}
      </div>
    </div>
  )
}
