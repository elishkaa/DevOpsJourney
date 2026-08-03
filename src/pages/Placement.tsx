import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SEED_BANK } from '../content'
import { SUBJECTS } from '../content/subjects'
import { answerPlacement, nextPlacementQuestion, startPlacement } from '../engine/placement'
import { PLACEMENT_QUESTIONS } from '../engine/constants'
import { grade, type Answer } from '../engine/grading'
import { bandOf } from '../engine/rating'
import { LEVEL_NAMES, type SubjectId } from '../types/challenge'
import { useProgressStore } from '../store/progressStore'
import { burst } from '../hooks/useConfetti'
import Button from '../components/ui/Button'
import Chip from '../components/ui/Chip'
import ProgressBar from '../components/ui/ProgressBar'
import MiniMarkdown from '../components/ui/MiniMarkdown'
import ArtifactBlock from '../components/challenge/ArtifactBlock'
import McqOptions from '../components/challenge/McqOptions'
import MultiOptions from '../components/challenge/MultiOptions'

/** Placement pool: options-style questions only, so calibration stays fast. */
const PLACEMENT_POOL = SEED_BANK.filter((c) => c.type === 'mcq' || c.type === 'multi')

export default function Placement() {
  const { subject } = useParams()
  return <PlacementInner key={subject} />
}

function PlacementInner() {
  const { subject: subjectParam } = useParams()
  const navigate = useNavigate()
  const recordPlacementAttempt = useProgressStore((s) => s.recordPlacementAttempt)
  const finishPlacement = useProgressStore((s) => s.finishPlacement)
  const skipPlacement = useProgressStore((s) => s.skipPlacement)

  const subjectId = subjectParam as SubjectId
  const meta = SUBJECTS[subjectId]

  const [state, setState] = useState(() => startPlacement(subjectId))
  const [mcqPick, setMcqPick] = useState<number | null>(null)
  const [multiPicks, setMultiPicks] = useState<number[]>([])
  const [finished, setFinished] = useState(false)
  const startRef = useRef(Date.now())

  const question = useMemo(
    () => (state.done ? null : nextPlacementQuestion(state, PLACEMENT_POOL)),
    [state],
  )

  if (!meta) {
    return (
      <div className="card p-6">
        <p className="text-muted">Unknown subject.</p>
        <Link to="/subjects" className="mt-2 inline-block text-sm text-brand hover:underline">
          ← Skill map
        </Link>
      </div>
    )
  }

  const finish = (finalRating: number) => {
    finishPlacement(subjectId, finalRating)
    setFinished(true)
    burst('big')
  }

  const submit = () => {
    if (!question) return
    const answer: Answer | null =
      question.type === 'mcq'
        ? mcqPick !== null
          ? { type: 'mcq', index: mcqPick }
          : null
        : multiPicks.length > 0
          ? { type: 'multi', indices: multiPicks }
          : null
    if (!answer) return
    const graded = grade(question, answer)
    const timeSec = Math.max(1, Math.round((Date.now() - startRef.current) / 1000))
    recordPlacementAttempt(question, graded.correct, timeSec)
    const next = answerPlacement(state, question, graded.correct)
    setMcqPick(null)
    setMultiPicks([])
    startRef.current = Date.now()
    setState(next)
    if (next.done) finish(next.rating)
  }

  // ---- reveal screen ----
  if (finished || state.done) {
    const band = bandOf(state.rating)
    return (
      <div className="mx-auto max-w-xl">
        <div className="card dj-pop p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">Calibration complete</p>
          <h1 className="mt-3 text-2xl font-bold">{meta.name}</h1>
          <p className="mt-6 text-5xl font-bold" style={{ color: meta.color }}>
            {LEVEL_NAMES[band]}
          </p>
          <p className="mono mt-2 text-sm text-muted">rating {Math.round(state.rating)} / 1000</p>
          <div className="mx-auto mt-4 max-w-xs">
            <ProgressBar fraction={state.rating / 1000} color={meta.color} />
            <div className="mt-1 flex justify-between text-[10px] text-faint">
              <span>Rookie</span>
              <span>Operator</span>
              <span>Engineer</span>
              <span>Architect</span>
            </div>
          </div>
          <p className="mx-auto mt-5 max-w-sm text-sm text-muted">
            Your daily {meta.short} challenges will start at this level and adapt as you play — up when you’re
            cruising, down when it hurts. That’s the point.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => navigate('/')}>Start training →</Button>
            <Button variant="ghost" onClick={() => navigate('/subjects')}>
              Place another subject
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="card p-6">
        <p className="text-muted">Not enough placement content for {meta.name} yet.</p>
        <Button className="mt-3" variant="ghost" onClick={() => { skipPlacement(subjectId); navigate('/') }}>
          Start as Rookie instead
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Chip label={meta.short} color={meta.color} />
          <span className="text-sm font-medium">Placement</span>
        </div>
        <span className="mono text-xs text-muted">
          {state.step + 1}/{PLACEMENT_QUESTIONS} · calibrating {LEVEL_NAMES[bandOf(state.rating)]}
        </span>
      </div>
      <ProgressBar fraction={state.step / PLACEMENT_QUESTIONS} color={meta.color} className="mb-5" />

      <div className="card p-5 sm:p-6" key={question.id}>
        <MiniMarkdown text={question.scenario} className="text-sm text-ink/90" />
        {question.artifact && <ArtifactBlock content={question.artifact} lang={question.artifactLang} />}
        <p className="mt-3 font-medium">{question.prompt}</p>
        <div className="mt-3">
          {question.type === 'mcq' && (
            <McqOptions challenge={question} selected={mcqPick} onSelect={setMcqPick} submitted={false} />
          )}
          {question.type === 'multi' && (
            <MultiOptions
              challenge={question}
              selected={multiPicks}
              onToggle={(i) =>
                setMultiPicks((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))
              }
              submitted={false}
            />
          )}
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={submit} disabled={question.type === 'mcq' ? mcqPick === null : multiPicks.length === 0}>
            {state.step === PLACEMENT_QUESTIONS - 1 ? 'Finish calibration' : 'Next →'}
          </Button>
          <button
            onClick={() => { skipPlacement(subjectId); navigate('/') }}
            className="cursor-pointer text-xs text-faint hover:text-muted"
          >
            skip — start as Rookie
          </button>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-faint">
        No XP pressure here — answers only calibrate your starting level. Honest beats lucky.
      </p>
    </div>
  )
}
