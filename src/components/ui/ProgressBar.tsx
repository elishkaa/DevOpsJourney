interface ProgressBarProps {
  fraction: number
  color?: string
  height?: number
  className?: string
}

export default function ProgressBar({ fraction, color = 'var(--c-brand)', height = 8, className = '' }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100
  return (
    <div className={`w-full overflow-hidden rounded-full bg-raised ${className}`} style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}
