import type { McqChallenge } from '../../types/challenge'

interface Props {
  challenge: McqChallenge
  selected: number | null
  onSelect: (i: number) => void
  submitted: boolean
}

export default function McqOptions({ challenge, selected, onSelect, submitted }: Props) {
  return (
    <div className="space-y-2">
      {challenge.options.map((opt, i) => {
        const isPick = selected === i
        const isCorrect = i === challenge.correctIndex
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
            onClick={() => onSelect(i)}
            className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${submitted ? '' : 'cursor-pointer'} ${cls}`}
          >
            <span
              className={`mono mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] ${
                isPick && !submitted ? 'border-brand text-brand' : 'border-line-strong text-muted'
              }`}
            >
              {String.fromCharCode(65 + i)}
            </span>
            <span className="leading-relaxed">{opt}</span>
          </button>
        )
      })}
    </div>
  )
}
