interface ArtifactBlockProps {
  content: string
  lang?: string
  /** When set, lines become clickable (spot-the-bug) */
  onLineClick?: (line: number) => void
  selectedLine?: number | null
  /** Lines to highlight as correct/wrong after grading */
  markLine?: { line: number; kind: 'correct' | 'wrong' } | null
  actualBuggyLine?: number | null
}

/** Monospace artifact viewer with line numbers; doubles as the spot-the-bug picker. */
export default function ArtifactBlock({
  content,
  lang,
  onLineClick,
  selectedLine,
  markLine,
  actualBuggyLine,
}: ArtifactBlockProps) {
  const lines = content.split('\n')
  const interactive = Boolean(onLineClick)
  return (
    <div className="my-3 overflow-hidden rounded-lg border border-line bg-base">
      {lang && (
        <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
          <span className="mono text-[11px] uppercase tracking-wider text-faint">{lang}</span>
          {interactive && <span className="text-[11px] text-muted">click the broken line</span>}
        </div>
      )}
      <pre className="mono overflow-x-auto p-0 text-[13px] leading-relaxed">
        {lines.map((line, i) => {
          const n = i + 1
          const isSelected = selectedLine === n
          const isMarked = markLine?.line === n
          const isActualBug = actualBuggyLine === n
          let rowCls = ''
          if (isMarked && markLine?.kind === 'correct') rowCls = 'bg-ok-soft'
          else if (isMarked && markLine?.kind === 'wrong') rowCls = 'bg-danger-soft'
          else if (isActualBug) rowCls = 'bg-ok-soft'
          else if (isSelected) rowCls = 'bg-brand-soft'
          return (
            <div
              key={n}
              onClick={onLineClick ? () => onLineClick(n) : undefined}
              className={`flex ${interactive ? 'cursor-pointer hover:bg-raised' : ''} ${rowCls}`}
            >
              <span className="w-10 shrink-0 select-none border-r border-line px-2 text-right text-faint">
                {n}
              </span>
              <span className="whitespace-pre px-3">{line || ' '}</span>
            </div>
          )
        })}
      </pre>
    </div>
  )
}
