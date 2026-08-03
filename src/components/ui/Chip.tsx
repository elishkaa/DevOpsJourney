interface ChipProps {
  label: string
  color?: string
  className?: string
}

/** Small colored tag — subject chips, severity chips, level pips */
export default function Chip({ label, color = 'var(--c-brand)', className = '' }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
      style={{ color, borderColor: `color-mix(in srgb, ${color} 45%, transparent)`, background: `color-mix(in srgb, ${color} 12%, transparent)` }}
    >
      {label}
    </span>
  )
}
