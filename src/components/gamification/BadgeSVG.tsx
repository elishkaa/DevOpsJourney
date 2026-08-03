import type { SubjectId } from '../../types/challenge'
import type { BadgeTier } from '../../engine/badges'
import { SUBJECTS } from '../../content/subjects'

const TIER_PALETTE: Record<BadgeTier, { main: string; light: string; dark: string; ribbon: string }> = {
  bronze: { main: '#b0713b', light: '#e3a06b', dark: '#7c4a22', ribbon: '#8a5527' },
  silver: { main: '#9aa7ba', light: '#d4dde8', dark: '#66707f', ribbon: '#7c8798' },
  gold: { main: '#e0a63c', light: '#f8d477', dark: '#a3701c', ribbon: '#b8860b' },
  platinum: { main: '#7fd4d0', light: '#c8f4f1', dark: '#3f8f8b', ribbon: '#4fa8a4' },
}

/** Minimal per-subject glyphs drawn as strokes, centered in a 24×24 box */
function Glyph({ subject, color }: { subject: SubjectId; color: string }) {
  const s = { stroke: color, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  switch (subject) {
    case 'linux': // terminal prompt
      return (
        <g {...s}>
          <path d="M7 8l4 4-4 4" />
          <path d="M13 16h5" />
        </g>
      )
    case 'git': // branch
      return (
        <g {...s}>
          <circle cx="8" cy="7" r="2" />
          <circle cx="8" cy="17" r="2" />
          <circle cx="16" cy="10" r="2" />
          <path d="M8 9v6" />
          <path d="M14.5 11.5C12 14 10 13 8.5 15" />
        </g>
      )
    case 'networking': // globe-ish
      return (
        <g {...s}>
          <circle cx="12" cy="12" r="6.5" />
          <path d="M5.5 12h13" />
          <path d="M12 5.5c2.5 2 2.5 11 0 13" />
          <path d="M12 5.5c-2.5 2-2.5 11 0 13" />
        </g>
      )
    case 'docker': // container box
      return (
        <g {...s}>
          <rect x="6" y="10" width="12" height="7" rx="1" />
          <path d="M9 10v-3h6v3" />
          <path d="M9 13.5h6" />
        </g>
      )
    case 'kubernetes': // helm wheel
      return (
        <g {...s}>
          <circle cx="12" cy="12" r="6.5" />
          <circle cx="12" cy="12" r="2" />
          <path d="M12 5.5v4M12 14.5v4M5.5 12h4M14.5 12h4M7.4 7.4l2.8 2.8M13.8 13.8l2.8 2.8M16.6 7.4l-2.8 2.8M10.2 13.8l-2.8 2.8" />
        </g>
      )
    case 'cicd': // loop arrows
      return (
        <g {...s}>
          <path d="M7 9a6 6 0 0 1 10 2" />
          <path d="M17 7v4h-4" />
          <path d="M17 15a6 6 0 0 1-10-2" />
          <path d="M7 17v-4h4" />
        </g>
      )
    case 'iac': // code brackets over blocks
      return (
        <g {...s}>
          <path d="M9 7L6 12l3 5" />
          <path d="M15 7l3 5-3 5" />
          <path d="M13 6l-2 12" />
        </g>
      )
    case 'cloud':
      return (
        <g {...s}>
          <path d="M7.5 16a3.5 3.5 0 0 1 .4-7 4.5 4.5 0 0 1 8.7 1.2A3 3 0 0 1 16 16z" />
        </g>
      )
    case 'observability': // pulse line
      return (
        <g {...s}>
          <path d="M5 13h3l2-5 3 8 2-5h4" />
        </g>
      )
    case 'security': // shield-lock
      return (
        <g {...s}>
          <path d="M12 5l5.5 2v4.5c0 3.5-2.3 6-5.5 7.5-3.2-1.5-5.5-4-5.5-7.5V7z" />
          <path d="M12 10.5v3" />
        </g>
      )
  }
}

interface BadgeSVGProps {
  subject: SubjectId
  tier: BadgeTier
  earned: boolean
  size?: number
}

/** Parametric shield badge: tier palette + subject glyph + ribbon. */
export default function BadgeSVG({ subject, tier, earned, size = 72 }: BadgeSVGProps) {
  const pal = TIER_PALETTE[tier]
  const subjectColor = SUBJECTS[subject].color
  const uid = `${subject}-${tier}`
  return (
    <svg
      viewBox="0 0 48 56"
      width={size}
      height={(size * 56) / 48}
      className={earned ? '' : 'opacity-40 grayscale'}
      role="img"
      aria-label={`${SUBJECTS[subject].name} ${tier} badge${earned ? '' : ' (locked)'}`}
    >
      <defs>
        <linearGradient id={`shield-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={pal.light} />
          <stop offset="0.55" stopColor={pal.main} />
          <stop offset="1" stopColor={pal.dark} />
        </linearGradient>
      </defs>
      {/* ribbon tails */}
      <path d="M14 40l-5 12 7-3 3 5 4-10z" fill={pal.ribbon} />
      <path d="M34 40l5 12-7-3-3 5-4-10z" fill={pal.ribbon} />
      {/* shield */}
      <path
        d="M24 2l17 5v14c0 11-7 18-17 22C14 39 7 32 7 21V7z"
        fill={`url(#shield-${uid})`}
        stroke={pal.dark}
        strokeWidth="1.5"
      />
      {/* inner face */}
      <path d="M24 6l13 3.8V21c0 8.6-5.4 14.4-13 17.8C16.4 35.4 11 29.6 11 21V9.8z" fill="#111a2e" />
      {/* subject glyph */}
      <g transform="translate(12,10)">
        <Glyph subject={subject} color={earned ? subjectColor : '#8b98b5'} />
      </g>
      {/* tier notch */}
      <circle cx="24" cy="34.5" r="3.2" fill={pal.main} stroke={pal.dark} strokeWidth="1" />
    </svg>
  )
}
