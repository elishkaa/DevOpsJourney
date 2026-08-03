import { describe, expect, it } from 'vitest'
import { dayDiff, dayKey, pickCotd, shiftDayKey } from '../src/engine/daily'

describe('dayKey', () => {
  it('anchors to Asia/Jerusalem', () => {
    // 23:30 UTC Aug 1 is 02:30 Aug 2 in Jerusalem (UTC+3 in summer)
    expect(dayKey(new Date('2026-08-01T23:30:00.000Z'))).toBe('2026-08-02')
    expect(dayKey(new Date('2026-08-01T12:00:00.000Z'))).toBe('2026-08-01')
  })

  it('handles winter time (UTC+2)', () => {
    // 22:30 UTC Jan 1 is 00:30 Jan 2 in Jerusalem (UTC+2 in winter)
    expect(dayKey(new Date('2026-01-01T22:30:00.000Z'))).toBe('2026-01-02')
  })
})

describe('shiftDayKey / dayDiff', () => {
  it('shifts across month boundaries', () => {
    expect(shiftDayKey('2026-08-31', 1)).toBe('2026-09-01')
    expect(shiftDayKey('2026-08-01', -1)).toBe('2026-07-31')
  })
  it('diffs whole days', () => {
    expect(dayDiff('2026-08-01', '2026-08-02')).toBe(1)
    expect(dayDiff('2026-08-02', '2026-08-01')).toBe(-1)
    expect(dayDiff('2026-08-01', '2026-08-01')).toBe(0)
  })
})

describe('pickCotd', () => {
  const ids = ['a-1', 'b-2', 'c-3', 'd-4', 'e-5']

  it('is deterministic for a day', () => {
    expect(pickCotd('2026-08-02', ids)).toBe(pickCotd('2026-08-02', ids))
  })

  it('returns a member of the pool', () => {
    for (const k of ['2026-08-02', '2026-08-03', '2026-12-31']) {
      expect(ids).toContain(pickCotd(k, ids))
    }
  })

  it('varies across days (not constant)', () => {
    const picks = new Set(['01', '02', '03', '04', '05', '06', '07', '08'].map((d) => pickCotd(`2026-08-${d}`, ids)))
    expect(picks.size).toBeGreaterThan(1)
  })

  it('throws on an empty pool', () => {
    expect(() => pickCotd('2026-08-02', [])).toThrow()
  })
})
