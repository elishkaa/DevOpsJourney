import { Link } from 'react-router-dom'
import { useSettingsStore } from '../../store/settingsStore'

export default function MentorUpsell() {
  const hasKey = useSettingsStore((s) => Boolean(s.settings.anthropicApiKey))
  if (hasKey) return null
  return (
    <div className="card border-dashed p-4">
      <h2 className="text-sm font-semibold">🧭 AI Mentor is dormant</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Add your own Claude API key to unlock free-text incident debriefs, personalized “explain like I’m
        stuck” answers, and freshly generated challenges. Optional — everything else works without it.
      </p>
      <Link to="/settings" className="mt-2 inline-block text-xs font-medium text-brand hover:underline">
        Wake the mentor →
      </Link>
    </div>
  )
}
