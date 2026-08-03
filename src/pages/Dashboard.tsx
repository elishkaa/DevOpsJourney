import { Navigate } from 'react-router-dom'
import { useSettingsStore } from '../store/settingsStore'
import { useDailySet } from '../hooks/useDailySet'
import TodayPanel from '../components/dashboard/TodayPanel'
import StreakFlame from '../components/dashboard/StreakFlame'
import XpBar from '../components/dashboard/XpBar'
import DueReviewsCard from '../components/dashboard/DueReviewsCard'
import MentorUpsell from '../components/dashboard/MentorUpsell'
import SubjectRadar from '../components/dashboard/SubjectRadar'
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap'

export default function Dashboard() {
  const settings = useSettingsStore((s) => s.settings)
  const { slots } = useDailySet()

  if (!settings.onboarded) return <Navigate to="/onboarding" replace />

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 5) return 'Burning the midnight oil'
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        {greeting}, <span className="font-medium text-ink">{settings.name}</span>. NimbusPay production is
        (mostly) quiet — here’s your shift.
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TodayPanel slots={slots} />
        </div>
        <div className="space-y-4">
          <StreakFlame />
          <XpBar />
          <DueReviewsCard />
          <MentorUpsell />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SubjectRadar />
        <ActivityHeatmap />
      </div>
    </div>
  )
}
