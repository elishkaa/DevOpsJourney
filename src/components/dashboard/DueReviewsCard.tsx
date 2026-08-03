import { Link } from 'react-router-dom'
import { useProgressStore } from '../../store/progressStore'
import { dayKey } from '../../engine/daily'
import { dueItems } from '../../engine/srs'
import { SUBJECTS } from '../../content/subjects'

export default function DueReviewsCard() {
  const queue = useProgressStore((s) => s.progress.reviewQueue)
  const due = dueItems(queue, dayKey(new Date()))
  if (queue.length === 0) return null
  return (
    <div className="card p-4">
      <h2 className="text-sm font-semibold">Review radar</h2>
      {due.length > 0 ? (
        <>
          <p className="mt-1 text-xs text-muted">
            {due.length} concept{due.length > 1 ? 's' : ''} due — spaced repetition keeps them from fading.
          </p>
          <ul className="mt-2 space-y-1">
            {due.slice(0, 4).map((r) => (
              <li key={r.challengeId} className="flex items-center gap-2 text-xs">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: SUBJECTS[r.subject].color }}
                />
                <Link to={`/challenge/${r.challengeId}?src=review`} className="mono truncate text-brand hover:underline">
                  {r.concept}
                </Link>
              </li>
            ))}
            {due.length > 4 && <li className="text-xs text-faint">+{due.length - 4} more…</li>}
          </ul>
        </>
      ) : (
        <p className="mt-1 text-xs text-muted">
          Nothing due today. {queue.length} concept{queue.length > 1 ? 's' : ''} on schedule.
        </p>
      )}
    </div>
  )
}
