import { useState } from 'react'
import type { AttemptOutcome } from '../../engine/applyAttempt'
import type { Answer } from '../../engine/grading'
import type { Challenge, FreeChallenge } from '../../types/challenge'
import { callClaude, friendlyAiError } from '../../ai/client'
import { gradeFreeText, type FreeTextVerdict } from '../../ai/grader'
import { EXPLAINER_SYSTEM, explainerUser } from '../../ai/prompts'
import { useProgressStore } from '../../store/progressStore'
import { useSettingsStore } from '../../store/settingsStore'
import Button from '../ui/Button'
import MiniMarkdown from '../ui/MiniMarkdown'

function MentorCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="dj-rise rounded-xl border border-brand/40 bg-brand-soft p-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand">AI Mentor</span>
      </div>
      {children}
    </div>
  )
}

/** Free-text answer box: grades via the user's Claude key, then hands the score to the engine. */
export function FreeAnswerPanel({
  challenge,
  submitted,
  onGraded,
}: {
  challenge: FreeChallenge
  submitted: boolean
  onGraded: (answer: Answer) => void
}) {
  const settings = useSettingsStore((s) => s.settings)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verdict, setVerdict] = useState<FreeTextVerdict | null>(null)

  const submit = async () => {
    if (busy || submitted || text.trim().length < 10) return
    setBusy(true)
    setError(null)
    try {
      const v = await gradeFreeText(settings, challenge, text.trim())
      setVerdict(v)
      onGraded({ type: 'free', text: text.trim(), aiScore: v.score })
    } catch (e) {
      setError(friendlyAiError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={submitted || busy}
        rows={6}
        placeholder="Explain your approach as you would in an incident review — commands, reasoning, trade-offs…"
        className="mono w-full rounded-xl border border-line bg-base p-3 text-sm outline-none placeholder:text-faint focus:border-brand/60"
      />
      {!submitted && (
        <div className="mt-3 flex items-center gap-3">
          <Button onClick={submit} disabled={busy || text.trim().length < 10}>
            {busy ? 'Mentor is grading…' : 'Submit for AI grading'}
          </Button>
          {error && <span className="text-sm text-danger">{error}</span>}
        </div>
      )}
      {verdict && (
        <div className="mt-4">
          <MentorCard>
            <p className="text-sm font-medium">
              Verdict: <span className="capitalize">{verdict.verdict}</span> · score{' '}
              {(verdict.score * 100).toFixed(0)}%
            </p>
            <MiniMarkdown text={verdict.feedback} className="mt-1 text-sm text-ink/90" />
          </MentorCard>
        </div>
      )}
    </div>
  )
}

/** "Explain like I'm stuck" — misconception-targeted explanation on wrong answers. */
export function ExplainStuck({
  challenge,
  outcome,
  userAnswer,
}: {
  challenge: Challenge
  outcome: AttemptOutcome
  userAnswer?: string
}) {
  const settings = useSettingsStore((s) => s.settings)
  const band = useProgressStore((s) => s.progress.subjects[challenge.subject].workingLevel)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [explanation, setExplanation] = useState<string | null>(null)

  if (outcome.correct || !settings.anthropicApiKey) return null

  const ask = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const text = await callClaude(settings, {
        system: EXPLAINER_SYSTEM,
        user: explainerUser(challenge, userAnswer ?? '(not captured)', band),
        maxTokens: 500,
      })
      setExplanation(text)
    } catch (e) {
      setError(friendlyAiError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {!explanation && (
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={ask} disabled={busy}>
            {busy ? 'Mentor is thinking…' : '🧭 Explain like I’m stuck'}
          </Button>
          {error && <span className="text-sm text-danger">{error}</span>}
        </div>
      )}
      {explanation && (
        <MentorCard>
          <MiniMarkdown text={explanation} className="text-sm text-ink/90" />
        </MentorCard>
      )}
    </div>
  )
}
