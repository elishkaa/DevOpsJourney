import { useState } from 'react'
import type { CommandChallenge } from '../../types/challenge'

interface Props {
  challenge: CommandChallenge
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  submitted: boolean
  correct?: boolean
}

export default function CommandInput({ challenge, value, onChange, onSubmit, submitted, correct }: Props) {
  const [showHint, setShowHint] = useState(false)
  return (
    <div>
      <div
        className={`mono flex items-center gap-2 rounded-xl border bg-base px-3 py-2.5 text-sm ${
          submitted ? (correct ? 'border-ok/60' : 'border-danger/60') : 'border-line focus-within:border-brand/60'
        }`}
      >
        <span className="select-none text-brand">$</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !submitted && value.trim()) onSubmit()
          }}
          disabled={submitted}
          placeholder={challenge.placeholder ?? 'type the command…'}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          className="w-full bg-transparent outline-none placeholder:text-faint"
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted">Press Enter to run. Whitespace and a leading “$” are forgiven.</p>
        {challenge.hint && !submitted && (
          <button
            onClick={() => setShowHint((s) => !s)}
            className="cursor-pointer text-xs text-brand hover:underline"
          >
            {showHint ? 'hide hint' : 'hint?'}
          </button>
        )}
      </div>
      {showHint && !submitted && challenge.hint && (
        <p className="mt-1 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted">
          {challenge.hint}
        </p>
      )}
      {submitted && !correct && (
        <div className="mono mt-3 rounded-lg border border-ok/40 bg-ok-soft px-3 py-2 text-sm">
          <span className="text-xs text-muted">an accepted answer: </span>
          <span className="text-ok">{challenge.acceptExamples[0]}</span>
        </div>
      )}
    </div>
  )
}
