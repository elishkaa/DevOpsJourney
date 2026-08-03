import { useEffect } from 'react'
import { dayKey } from '../engine/daily'
import { dueItems } from '../engine/srs'
import { streakAtRisk } from '../engine/streak'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'

function canNotify(): boolean {
  return 'Notification' in window && Notification.permission === 'granted'
}

function onceKey(kind: string, day: string): string {
  return `dj.notified.${kind}.${day}`
}

function notifyOnce(kind: string, day: string, title: string, body: string): void {
  const key = onceKey(kind, day)
  if (localStorage.getItem(key)) return
  try {
    new Notification(title, { body, icon: undefined })
    localStorage.setItem(key, '1')
  } catch {
    // some platforms (Android Chrome) require SW-based notifications; silently skip
  }
}

/**
 * In-app notification triggers (honest limitation of a static site: these fire
 * when the app is open — the daily email is the external nudge).
 * Checks on mount and every 10 minutes: streak at risk after reminderHour,
 * and reviews due (each at most once per day).
 */
export function useNotifications(): void {
  const enabled = useSettingsStore((s) => s.settings.notificationsEnabled)
  const reminderHour = useSettingsStore((s) => s.settings.reminderHour)

  useEffect(() => {
    if (!enabled) return
    const check = () => {
      if (!canNotify()) return
      const { progress } = useProgressStore.getState()
      const now = new Date()
      const today = dayKey(now)

      if (now.getHours() >= reminderHour && streakAtRisk(progress.streak, today)) {
        notifyOnce(
          'streak',
          today,
          `🔥 ${progress.streak.current}-day streak at risk`,
          'One challenge keeps the flame alive. Takes ~2 minutes.',
        )
      }

      const due = dueItems(progress.reviewQueue, today)
      if (due.length > 0) {
        notifyOnce(
          'reviews',
          today,
          `↻ ${due.length} concept${due.length > 1 ? 's' : ''} due for review`,
          'Spaced repetition works when the space ends. Today it ends.',
        )
      }
    }
    check()
    const t = setInterval(check, 10 * 60 * 1000)
    return () => clearInterval(t)
  }, [enabled, reminderHour])
}
