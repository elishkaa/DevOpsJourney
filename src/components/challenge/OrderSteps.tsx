import type { OrderChallenge } from '../../types/challenge'

interface Props {
  challenge: OrderChallenge
  /** Current arrangement: original step indices in display order */
  arrangement: number[]
  onMove: (position: number, dir: -1 | 1) => void
  submitted: boolean
}

export default function OrderSteps({ challenge, arrangement, onMove, submitted }: Props) {
  return (
    <div className="space-y-2">
      {arrangement.map((stepIndex, position) => {
        const text = challenge.steps[stepIndex]
        const inPlace = stepIndex === position
        let cls = 'border-line bg-surface'
        if (submitted) cls = inPlace ? 'border-ok/60 bg-ok-soft' : 'border-danger/60 bg-danger-soft'
        return (
          <div key={stepIndex} className={`flex items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${cls}`}>
            <span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line-strong text-xs text-muted">
              {position + 1}
            </span>
            <span className="flex-1 leading-relaxed">{text}</span>
            {!submitted && (
              <span className="flex shrink-0 flex-col gap-1">
                <button
                  aria-label="move up"
                  disabled={position === 0}
                  onClick={() => onMove(position, -1)}
                  className="cursor-pointer rounded-md border border-line px-1.5 text-xs text-muted hover:bg-raised hover:text-ink disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  aria-label="move down"
                  disabled={position === arrangement.length - 1}
                  onClick={() => onMove(position, 1)}
                  className="cursor-pointer rounded-md border border-line px-1.5 text-xs text-muted hover:bg-raised hover:text-ink disabled:opacity-30"
                >
                  ▼
                </button>
              </span>
            )}
            {submitted && !inPlace && (
              <span className="mono shrink-0 text-xs text-muted">→ {stepIndex + 1}</span>
            )}
          </div>
        )
      })}
      {!submitted && <p className="pt-1 text-xs text-muted">Arrange with the arrows until the order is right.</p>}
    </div>
  )
}
