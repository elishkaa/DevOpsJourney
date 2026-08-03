import { useState } from 'react'
import { useProgressStore } from '../../store/progressStore'
import { dayKey, shiftDayKey } from '../../engine/daily'

/** Sequential single-hue ramp (teal), empty → intense, tuned for the dark surface */
const RAMP = ['var(--c-raised)', '#134e4a', '#0f766e', '#14b8a6', '#5eead4']

function level(done: number): number {
  if (done <= 0) return 0
  if (done === 1) return 1
  if (done === 2) return 2
  if (done <= 4) return 3
  return 4
}

const WEEKS = 12

export default function ActivityHeatmap() {
  const dailyLog = useProgressStore((s) => s.progress.dailyLog)
  const [hover, setHover] = useState<{ day: string; done: number; xp: number } | null>(null)

  const today = dayKey(new Date())
  // Build columns of 7 days, ending today
  const days: string[] = []
  for (let i = WEEKS * 7 - 1; i >= 0; i--) days.push(shiftDayKey(today, -i))
  const columns: string[][] = []
  for (let w = 0; w < WEEKS; w++) columns.push(days.slice(w * 7, w * 7 + 7))

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Last {WEEKS} weeks</h2>
        <span className="h-4 text-[11px] text-muted">
          {hover ? `${hover.day}: ${hover.done} solved · ${hover.xp} XP` : ''}
        </span>
      </div>
      <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-1">
            {col.map((day) => {
              const entry = dailyLog[day]
              const lv = level(entry?.done ?? 0)
              return (
                <div
                  key={day}
                  onMouseEnter={() => setHover({ day, done: entry?.done ?? 0, xp: entry?.xp ?? 0 })}
                  onMouseLeave={() => setHover(null)}
                  title={`${day}: ${entry?.done ?? 0} solved`}
                  className="h-3.5 w-3.5 rounded-[3px] border border-line/60"
                  style={{
                    background: RAMP[lv],
                    outline: entry?.perfect ? '1px solid var(--c-gold)' : undefined,
                    outlineOffset: -1,
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-faint">
        <span className="mr-1">less</span>
        {RAMP.map((c, i) => (
          <span key={i} className="h-2.5 w-2.5 rounded-[2px] border border-line/60" style={{ background: c }} />
        ))}
        <span className="ml-1">more</span>
        <span className="ml-3 h-2.5 w-2.5 rounded-[2px] border border-gold" />
        <span>perfect day</span>
      </div>
    </div>
  )
}
