import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SEED_BANK } from '../content'
import { SUBJECTS } from '../content/subjects'
import { LEVEL_NAMES, type SubjectId } from '../types/challenge'
import { bandOf } from '../engine/rating'
import { pickPractice } from '../engine/selector'
import type { BadgeTier } from '../engine/badges'
import { generateChallenges } from '../ai/generator'
import { friendlyAiError } from '../ai/client'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import Button from '../components/ui/Button'
import ProgressBar from '../components/ui/ProgressBar'
import BadgeSVG from '../components/gamification/BadgeSVG'

export default function SubjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const progress = useProgressStore((s) => s.progress)
  const addCustomChallenges = useProgressStore((s) => s.addCustomChallenges)
  const settings = useSettingsStore((s) => s.settings)
  const aiEnabled = Boolean(settings.anthropicApiKey)
  const [genBusy, setGenBusy] = useState(false)
  const [genMsg, setGenMsg] = useState<string | null>(null)

  const subjectId = id as SubjectId
  const meta = SUBJECTS[subjectId]
  if (!meta) {
    return (
      <div className="card p-6">
        <p className="text-muted">Unknown subject.</p>
        <Link to="/subjects" className="text-sm text-brand hover:underline">← Skill map</Link>
      </div>
    )
  }

  const sp = progress.subjects[subjectId]
  const all = [...SEED_BANK, ...progress.customChallenges].filter((c) => c.subject === subjectId)
  const accuracy = sp.attempts > 0 ? Math.round((sp.correct / sp.attempts) * 100) : null
  const attempts = progress.history.filter((h) => h.subject === subjectId).slice(-8).reverse()
  const practice = pickPractice(subjectId, SEED_BANK, progress, aiEnabled, `detail:${subjectId}:${sp.attempts}`)

  const fundamentals = new Map<string, { solved: number; missed: number }>()
  for (const c of all) {
    const entry = fundamentals.get(c.fundamental) ?? { solved: 0, missed: 0 }
    if (sp.completedIds.includes(c.id)) entry.solved++
    fundamentals.set(c.fundamental, entry)
  }
  for (const r of progress.reviewQueue.filter((r) => r.subject === subjectId)) {
    const entry = fundamentals.get(r.concept) ?? { solved: 0, missed: 0 }
    entry.missed++
    fundamentals.set(r.concept, entry)
  }

  const generate = async () => {
    if (genBusy) return
    setGenBusy(true)
    setGenMsg(null)
    try {
      const res = await generateChallenges(settings, subjectId, sp.workingLevel, [
        ...SEED_BANK,
        ...progress.customChallenges,
      ])
      addCustomChallenges(res.valid)
      setGenMsg(
        res.valid.length > 0
          ? `${res.valid.length} new challenge${res.valid.length > 1 ? 's' : ''} added${res.droppedCount ? ` (${res.droppedCount} failed validation)` : ''} — they’ll appear in practice and daily picks.`
          : 'The mentor’s challenges failed validation — try again.',
      )
    } catch (e) {
      setGenMsg(friendlyAiError(e))
    } finally {
      setGenBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: meta.color }} />
              <h1 className="text-xl font-bold">{meta.name}</h1>
            </div>
            <p className="mt-1 text-sm text-muted">{meta.blurb}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={!practice} onClick={() => practice && navigate(`/challenge/${practice.id}?src=practice`)}>
              Practice now
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/placement/${subjectId}`)}>
              {sp.placed ? 'Re-place' : 'Place me'}
            </Button>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted">Rating</p>
            <p className="mono text-lg font-bold" style={{ color: meta.color }}>
              {sp.placed ? Math.round(sp.rating) : '—'}
            </p>
            <ProgressBar fraction={sp.rating / 1000} color={meta.color} height={6} className="mt-1" />
            <p className="mt-1 text-[11px] text-faint">
              {sp.placed ? `${LEVEL_NAMES[bandOf(sp.rating)]} · daily picks at L${sp.workingLevel}` : 'not placed yet'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Record</p>
            <p className="text-lg font-bold">
              {sp.correct}
              <span className="text-sm font-normal text-muted">/{sp.attempts} correct</span>
            </p>
            <p className="mt-1 text-[11px] text-faint">{accuracy !== null ? `${accuracy}% accuracy` : 'no attempts yet'}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Peak level</p>
            <p className="text-lg font-bold">{LEVEL_NAMES[sp.levelPeak]}</p>
            <p className="mt-1 text-[11px] text-faint">{sp.completedIds.length} challenges solved</p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold">Tier badges</h2>
        <div className="mt-2 flex gap-4">
          {(['bronze', 'silver', 'gold', 'platinum'] as BadgeTier[]).map((tier) => (
            <div key={tier} className="text-center">
              <BadgeSVG subject={subjectId} tier={tier} earned={Boolean(progress.badges[`subj_${subjectId}_${tier}`])} size={56} />
              <p className="mt-1 text-[10px] capitalize text-muted">{tier}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-sm font-semibold">Fundamentals coverage</h2>
          {fundamentals.size === 0 ? (
            <p className="mt-2 text-xs text-muted">Content arriving soon.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {[...fundamentals.entries()].map(([concept, { solved, missed }]) => (
                <li key={concept} className="flex items-center justify-between text-xs">
                  <span className="mono">{concept}</span>
                  <span className="flex items-center gap-2">
                    {solved > 0 && <span className="text-ok">{solved} ✓</span>}
                    {missed > 0 && <span className="text-warn">{missed} in review</span>}
                    {solved === 0 && missed === 0 && <span className="text-faint">untouched</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="text-sm font-semibold">🧭 Fresh challenges from the mentor</h2>
            <p className="mt-1 text-xs text-muted">
              Generates 3 brand-new {meta.short} challenges at your current level, schema-validated before
              they enter your bank.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Button size="sm" onClick={generate} disabled={!aiEnabled || genBusy}>
                {genBusy ? 'Generating…' : 'Generate 3 challenges'}
              </Button>
              {!aiEnabled && (
                <Link to="/settings" className="text-xs text-brand hover:underline">
                  needs an API key
                </Link>
              )}
            </div>
            {genMsg && <p className="mt-2 text-xs text-muted">{genMsg}</p>}
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold">Recent attempts</h2>
            {attempts.length === 0 ? (
              <p className="mt-2 text-xs text-muted">None yet — go break something (educationally).</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {attempts.map((a, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-xs">
                    <span className={`shrink-0 ${a.correct ? 'text-ok' : 'text-danger'}`}>
                      {a.correct ? '✓' : '✗'}
                    </span>
                    <Link to={`/challenge/${a.challengeId}?src=practice`} className="mono flex-1 truncate text-muted hover:text-brand">
                      {a.challengeId}
                    </Link>
                    <span className="mono shrink-0 text-faint">
                      L{a.level} · {a.src} · +{a.xpEarned}xp
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
