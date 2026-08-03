import { useProgressStore } from '../../store/progressStore'
import { levelProgress, nextRank, rankTitle } from '../../engine/xp'
import ProgressBar from '../ui/ProgressBar'

export default function XpBar() {
  const xp = useProgressStore((s) => s.progress.xp)
  const { level, into, needed } = levelProgress(xp)
  const rank = rankTitle(level)
  const upcoming = nextRank(level)
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-lg font-bold text-brand">
            {level}
          </span>
          <div>
            <p className="font-semibold leading-tight">{rank}</p>
            <p className="text-xs text-muted">
              {into}/{needed} XP to level {level + 1}
            </p>
          </div>
        </div>
        <span className="mono text-sm font-semibold text-gold">{xp.toLocaleString()} XP</span>
      </div>
      <ProgressBar fraction={into / needed} color="var(--c-gold)" className="mt-3" />
      {upcoming && (
        <p className="mt-2 text-right text-[11px] text-faint">
          next rank at lvl {upcoming.level}: “{upcoming.title}”
        </p>
      )}
    </div>
  )
}
