import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { SEED_BANK } from '../content'
import { grade, type Answer } from '../engine/grading'
import { seededShuffle } from '../engine/rng'
import { findChallenge } from '../engine/selector'
import type { AttemptOutcome } from '../engine/applyAttempt'
import type { Challenge } from '../types/challenge'
import type { AttemptSource } from '../types/progress'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import { useDailySet, nextUndoneSlot } from '../hooks/useDailySet'
import { burst } from '../hooks/useConfetti'
import Button from '../components/ui/Button'
import MiniMarkdown from '../components/ui/MiniMarkdown'
import ScenarioHeader from '../components/challenge/ScenarioHeader'
import ArtifactBlock from '../components/challenge/ArtifactBlock'
import McqOptions from '../components/challenge/McqOptions'
import MultiOptions from '../components/challenge/MultiOptions'
import OrderSteps from '../components/challenge/OrderSteps'
import CommandInput from '../components/challenge/CommandInput'
import ResultPanel from '../components/challenge/ResultPanel'
import CelebrationLayer from '../components/gamification/CelebrationLayer'
import { ExplainStuck, FreeAnswerPanel } from '../components/challenge/MentorPanel'

export default function ChallengePlayer() {
  const { id } = useParams()
  // key by challenge id so navigating between challenges resets all local state
  return <PlayerInner key={id ?? 'none'} id={id} />
}

function PlayerInner({ id }: { id: string | undefined }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const srcParam = (params.get('src') ?? 'practice') as AttemptSource
  const src: AttemptSource = (['daily', 'review', 'practice'] as AttemptSource[]).includes(srcParam)
    ? srcParam
    : 'practice'

  const progress = useProgressStore((s) => s.progress)
  const submitAnswer = useProgressStore((s) => s.submitAnswer)
  const settings = useSettingsStore((s) => s.settings)
  const { slots } = useDailySet()

  const challenge: Challenge | undefined = useMemo(
    () => (id ? findChallenge(id, SEED_BANK, progress.customChallenges) : undefined),
    [id, progress.customChallenges],
  )

  // ---- answer state ----
  const [mcqPick, setMcqPick] = useState<number | null>(null)
  const [multiPicks, setMultiPicks] = useState<number[]>([])
  const [commandText, setCommandText] = useState('')
  const [spotLine, setSpotLine] = useState<number | null>(null)
  const initialArrangement = useMemo(() => {
    if (!challenge || challenge.type !== 'order') return []
    const n = challenge.steps.length
    const shuffled = seededShuffle([...Array(n).keys()], `order:${challenge.id}`)
    if (shuffled.every((v, i) => v === i)) shuffled.push(shuffled.shift()!)
    return shuffled
  }, [challenge])
  const [arrangement, setArrangement] = useState<number[]>(initialArrangement)

  const [outcome, setOutcome] = useState<AttemptOutcome | null>(null)
  const startRef = useRef(Date.now())

  if (!challenge) {
    return (
      <div className="card p-6">
        <p className="text-muted">This challenge doesn’t exist (it may have been removed).</p>
        <Link to="/" className="mt-3 inline-block text-sm text-brand hover:underline">
          ← Back to Today
        </Link>
      </div>
    )
  }

  if (challenge.type === 'free' && !settings.anthropicApiKey) {
    return (
      <div className="card p-6">
        <p className="font-medium">This is a free-text challenge — it needs the AI Mentor.</p>
        <p className="mt-1 text-sm text-muted">
          Add your Anthropic API key in Settings to unlock free-text grading.
        </p>
        <Link to="/settings" className="mt-3 inline-block text-sm text-brand hover:underline">
          Open Settings →
        </Link>
      </div>
    )
  }

  const submitted = outcome !== null

  const buildAnswer = (): Answer | null => {
    switch (challenge.type) {
      case 'mcq':
        return mcqPick === null ? null : { type: 'mcq', index: mcqPick }
      case 'multi':
        return multiPicks.length === 0 ? null : { type: 'multi', indices: multiPicks }
      case 'order':
        return { type: 'order', sequence: arrangement }
      case 'command':
        return commandText.trim() === '' ? null : { type: 'command', text: commandText }
      case 'spot':
        return spotLine === null ? null : { type: 'spot', line: spotLine }
      case 'free':
        return null // free-text goes through the AI grading path below
    }
  }

  const applyGraded = (answer: Answer) => {
    if (submitted) return
    const graded = grade(challenge, answer)
    const timeSec = Math.max(1, Math.round((Date.now() - startRef.current) / 1000))
    const result = submitAnswer(challenge, graded, src, timeSec)
    setOutcome(result)
    if (result.correct) burst('small')
  }

  const handleSubmit = () => {
    const answer = buildAnswer()
    if (answer) applyGraded(answer)
  }

  const next = src !== 'practice' ? nextUndoneSlot(slots, challenge.id) : null

  const describeUserAnswer = (): string => {
    switch (challenge.type) {
      case 'mcq':
        return mcqPick !== null ? challenge.options[mcqPick] : '(none)'
      case 'multi':
        return multiPicks.map((i) => challenge.options[i]).join(' AND ') || '(none)'
      case 'order':
        return arrangement.map((s, i) => `${i + 1}. ${challenge.steps[s]}`).join('\n')
      case 'command':
        return commandText
      case 'spot':
        return spotLine !== null
          ? `Line ${spotLine}: ${challenge.snippet.split('\n')[spotLine - 1] ?? ''}`
          : '(none)'
      case 'free':
        return '(free text)'
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="card p-5 sm:p-6">
        <ScenarioHeader challenge={challenge} src={src} />
        <MiniMarkdown text={challenge.scenario} className="mt-4 text-sm text-ink/90" />
        {challenge.artifact && challenge.type !== 'spot' && (
          <ArtifactBlock content={challenge.artifact} lang={challenge.artifactLang} />
        )}

        <p className="mt-4 font-medium">{challenge.prompt}</p>

        <div className="mt-3">
          {challenge.type === 'mcq' && (
            <McqOptions challenge={challenge} selected={mcqPick} onSelect={setMcqPick} submitted={submitted} />
          )}
          {challenge.type === 'multi' && (
            <MultiOptions
              challenge={challenge}
              selected={multiPicks}
              onToggle={(i) =>
                setMultiPicks((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))
              }
              submitted={submitted}
            />
          )}
          {challenge.type === 'order' && (
            <OrderSteps
              challenge={challenge}
              arrangement={arrangement}
              onMove={(pos, dir) =>
                setArrangement((prev) => {
                  const nextArr = prev.slice()
                  const j = pos + dir
                  ;[nextArr[pos], nextArr[j]] = [nextArr[j], nextArr[pos]]
                  return nextArr
                })
              }
              submitted={submitted}
            />
          )}
          {challenge.type === 'command' && (
            <CommandInput
              challenge={challenge}
              value={commandText}
              onChange={setCommandText}
              onSubmit={handleSubmit}
              submitted={submitted}
              correct={outcome?.correct}
            />
          )}
          {challenge.type === 'spot' && (
            <ArtifactBlock
              content={challenge.snippet}
              lang={challenge.snippetLang}
              onLineClick={submitted ? undefined : setSpotLine}
              selectedLine={spotLine}
              markLine={
                submitted && spotLine !== null
                  ? { line: spotLine, kind: outcome!.correct ? 'correct' : 'wrong' }
                  : null
              }
              actualBuggyLine={submitted && !outcome?.correct ? challenge.buggyLine : null}
            />
          )}
          {challenge.type === 'free' && (
            <FreeAnswerPanel challenge={challenge} submitted={submitted} onGraded={applyGraded} />
          )}
        </div>

        {!submitted && challenge.type !== 'free' && (
          <div className="mt-5">
            <Button onClick={handleSubmit} disabled={buildAnswer() === null}>
              {challenge.type === 'command' ? 'Run command' : 'Submit answer'}
            </Button>
          </div>
        )}

        {submitted && outcome && (
          <ResultPanel
            challenge={challenge}
            outcome={outcome}
            mentorSlot={
              challenge.type !== 'free' ? (
                <ExplainStuck challenge={challenge} outcome={outcome} userAnswer={describeUserAnswer()} />
              ) : null
            }
          />
        )}

        {submitted && (
          <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-4">
            {next && (
              <Button
                onClick={() =>
                  navigate(`/challenge/${next.challengeId}?src=${next.kind === 'review' ? 'review' : 'daily'}`)
                }
              >
                Next challenge →
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate('/')}>
              Back to Today
            </Button>
          </div>
        )}
      </div>

      {outcome && <CelebrationLayer outcome={outcome} />}
    </div>
  )
}
