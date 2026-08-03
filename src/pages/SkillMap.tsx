import { Link, useNavigate } from 'react-router-dom'
import { SEED_BANK } from '../content'
import { SUBJECT_LIST } from '../content/subjects'
import { LEVEL_NAMES } from '../types/challenge'
import { bandOf } from '../engine/rating'
import { pickPractice } from '../engine/selector'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import Button from '../components/ui/Button'
import ProgressBar from '../components/ui/ProgressBar'

export default function SkillMap() {
  const progress = useProgressStore((s) => s.progress)
  const aiEnabled = useSettingsStore((s) => Boolean(s.settings.anthropicApiKey))
  const navigate = useNavigate()

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Skill map</h1>
        <p className="text-sm text-muted">Ten disciplines. Your rating adapts in each one independently.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUBJECT_LIST.map((meta) => {
          const sp = progress.subjects[meta.id]
          const total = SEED_BANK.filter((c) => c.subject === meta.id && c.type !== 'free').length
          const solved = sp.completedIds.length
          const practice = pickPractice(meta.id, SEED_BANK, progress, aiEnabled, `map:${meta.id}:${sp.attempts}`)
          return (
            <div key={meta.id} className="card flex flex-col p-4">
              <Link to={`/subjects/${meta.id}`} className="group">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
                    <span className="font-semibold group-hover:text-brand">{meta.name}</span>
                  </span>
                  {sp.placed ? (
                    <span className="mono text-xs text-muted">{Math.round(sp.rating)}</span>
                  ) : (
                    <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-faint">
                      not placed
                    </span>
                  )}
                </div>
              </Link>
              <p className="mt-1 line-clamp-2 min-h-8 text-xs text-muted">{meta.blurb}</p>
              <div className="mt-3">
                <ProgressBar fraction={sp.rating / 1000} color={meta.color} height={6} />
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-faint">
                  <span>
                    {sp.placed ? `${LEVEL_NAMES[bandOf(sp.rating)]} · serving L${sp.workingLevel}` : 'level unknown'}
                  </span>
                  <span>
                    {solved}/{total} solved
                  </span>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {sp.placed ? (
                  <>
                    <Button
                      size="sm"
                      disabled={!practice}
                      onClick={() => practice && navigate(`/challenge/${practice.id}?src=practice`)}
                    >
                      Practice
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/subjects/${meta.id}`)}>
                      Details
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => navigate(`/placement/${meta.id}`)}>
                    Place me →
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
