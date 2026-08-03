import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { useProgressStore } from '../../store/progressStore'
import { SUBJECT_LIST } from '../../content/subjects'
import { bandOf } from '../../engine/rating'
import { LEVEL_NAMES } from '../../types/challenge'

export default function SubjectRadar() {
  const subjects = useProgressStore((s) => s.progress.subjects)
  const data = SUBJECT_LIST.map((meta) => ({
    subject: meta.short,
    fullName: meta.name,
    rating: Math.round(subjects[meta.id].rating),
  }))

  return (
    <div className="card p-4">
      <h2 className="mb-1 text-sm font-semibold">Skill shape</h2>
      <p className="mb-2 text-xs text-muted">Rating 0–1000 per subject — the shape shows where to push next.</p>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--c-line)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--c-muted)', fontSize: 11 }} />
          <PolarRadiusAxis
            domain={[0, 1000]}
            tickCount={5}
            tick={{ fill: 'var(--c-faint)', fontSize: 9 }}
            stroke="var(--c-line)"
            axisLine={false}
          />
          <Radar
            name="rating"
            dataKey="rating"
            stroke="var(--c-brand)"
            strokeWidth={2}
            fill="var(--c-brand)"
            fillOpacity={0.18}
            isAnimationActive={false}
          />
          <Tooltip
            cursor={false}
            content={({ payload }) => {
              const p = payload?.[0]?.payload as (typeof data)[number] | undefined
              if (!p) return null
              return (
                <div className="card px-3 py-2 text-xs shadow-xl">
                  <p className="font-semibold">{p.fullName}</p>
                  <p className="mono mt-0.5 text-muted">
                    {p.rating} · {LEVEL_NAMES[bandOf(p.rating)]}
                  </p>
                </div>
              )
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
