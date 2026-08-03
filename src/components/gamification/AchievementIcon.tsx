const EMOJI: Record<string, string> = {
  ach_first_blood: '🩸',
  ach_calibrated: '🎯',
  ach_polyglot: '🗺️',
  ach_streak_3: '🔥',
  ach_streak_7: '🔥',
  ach_streak_14: '🔥',
  ach_streak_30: '🔥',
  ach_comeback: '💪',
  ach_perfect_day: '🌟',
  ach_perfect_week: '👑',
  ach_speedrunner: '⚡',
  ach_bug_hunter: '🐛',
  ach_shell_samurai: '⌨️',
  ach_scholar: '🎓',
  ach_early_bird: '🌅',
  ach_centurion: '💯',
  ach_architect: '🏛️',
}

export default function AchievementIcon({ id, earned, size = 44 }: { id: string; earned: boolean; size?: number }) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl border ${
        earned ? 'border-gold/50 bg-warn-soft dj-glow' : 'border-line bg-raised opacity-40 grayscale'
      }`}
      style={{ width: size + 20, height: size + 20, fontSize: size * 0.62 }}
    >
      <span>{EMOJI[id] ?? '🏅'}</span>
    </div>
  )
}
