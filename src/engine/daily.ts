import { APP_TIMEZONE } from './constants'
import { xmur3 } from './rng'

/**
 * Canonical day key (YYYY-MM-DD) in the app timezone.
 * Shared by the browser app AND scripts/cotd.mjs so the emailed
 * Challenge of the Day always matches what the app shows.
 */
export function dayKey(date: Date, timeZone: string = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** dayKey shifted by N days (computed in UTC space from a dayKey string) */
export function shiftDayKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/** Whole-day difference b − a between two dayKeys */
export function dayDiff(a: string, b: string): number {
  const toUtc = (k: string) => {
    const [y, m, d] = k.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((toUtc(b) - toUtc(a)) / 86400000)
}

/**
 * Stateless Challenge of the Day pick over the seed bank.
 * `sortedIds` MUST be the seed challenge ids sorted ascending — both the app
 * and the email script derive it the same way.
 */
export function pickCotd(key: string, sortedIds: readonly string[]): string {
  if (sortedIds.length === 0) throw new Error('pickCotd: empty bank')
  return sortedIds[xmur3(`cotd:${key}`) % sortedIds.length]
}
