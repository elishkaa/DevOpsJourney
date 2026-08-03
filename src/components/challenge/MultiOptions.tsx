import type { MultiChallenge } from '../../types/challenge'

interface Props {
  challenge: MultiChallenge
  selected: number[]
  onToggle: (i: number) => void
  submitted: boolean
}

export default function MultiOptions({ challenge, selected, onToggle, submitted }: Props) {
  return (
    <div className="space-y-2">
      {challenge.options.map((opt, i) => {
        const isPick = selected.includes(i)
        const isCorrect = challenge.correctIndices.includes(i)
        let cls = 'border-line bg-surface hover:border-line-strong hover:bg-raised'
        if (submitted) {
          if (isCorrect) cls = 'border-ok/60 bg-ok-soft'
          else if (isPick) cls = 'border-danger/60 bg-danger-soft'
          else cls = 'border-line bg-surface opacity-60'
        } else if (isPick) {
          cls = 'border-brand/70 bg-brand-soft'
        }
        return (
          <button
            key={i}
            disabled={submitted}
            onClick={() => onToggle(i)}
            className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${submitted ? '' : 'cursor-pointer'} ${cls}`}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] ${
                isPick ? 'border-brand bg-brand text-[#06201c]' : 'border-line-strong text-transparent'
              }`}
            >
              ✓
            </span>
            <span className="leading-relaxed">{opt}</span>
          </button>
        )
      })}
      {!submitted && (
        <p className="pt-1 text-xs text-muted">Select every answer that applies, then submit.</p>
      )}
    </div>
  )
}
