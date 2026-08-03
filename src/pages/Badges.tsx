import { ALL_BADGES } from '../engine/badges'
import { SUBJECT_LIST } from '../content/subjects'
import { useProgressStore } from '../store/progressStore'
import BadgeSVG from '../components/gamification/BadgeSVG'
import AchievementIcon from '../components/gamification/AchievementIcon'
import type { BadgeTier } from '../engine/badges'

const TIERS: BadgeTier[] = ['bronze', 'silver', 'gold', 'platinum']

export default function Badges() {
  const badges = useProgressStore((s) => s.progress.badges)
  const achievements = ALL_BADGES.filter((b) => b.kind === 'achievement')
  const earnedCount = Object.keys(badges).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">Badge wall</h1>
        <p className="text-sm text-muted">
          {earnedCount}/{ALL_BADGES.length} earned. Badges are forever — nothing here can be taken away.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Subject tiers</h2>
        <div className="card overflow-x-auto p-4">
          <table className="w-full min-w-105">
            <thead>
              <tr>
                <th className="pb-2 text-left text-xs font-medium text-faint">Subject</th>
                {TIERS.map((t) => (
                  <th key={t} className="pb-2 text-center text-xs font-medium capitalize text-faint">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SUBJECT_LIST.map((meta) => (
                <tr key={meta.id} className="border-t border-line">
                  <td className="py-2 pr-3">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                      {meta.short}
                    </span>
                  </td>
                  {TIERS.map((tier) => {
                    const id = `subj_${meta.id}_${tier}`
                    const earnedAt = badges[id]
                    return (
                      <td key={tier} className="py-2 text-center" title={earnedAt ? `earned ${earnedAt.slice(0, 10)}` : 'locked'}>
                        <div className="inline-block">
                          <BadgeSVG subject={meta.id} tier={tier} earned={Boolean(earnedAt)} size={44} />
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Achievements</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((b) => {
            const earnedAt = badges[b.id]
            return (
              <div key={b.id} className={`card flex items-center gap-3 p-3 ${earnedAt ? '' : 'opacity-80'}`}>
                <AchievementIcon id={b.id} earned={Boolean(earnedAt)} size={34} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{b.name}</p>
                  <p className="text-xs text-muted">{b.description}</p>
                  <p className="mt-0.5 text-[10px] text-faint">
                    {earnedAt ? `earned ${earnedAt.slice(0, 10)}` : 'locked'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
