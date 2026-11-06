import { describe, expect, it } from 'vitest'
import { coerceProgress, coerceSettings } from '../src/store/migrations'
import { parseBackup, buildBackup, BackupParseError } from '../src/store/backup'
import { freshProgress } from './fixtures'
import { initialSettings } from '../src/types/settings'

describe('coerceProgress', () => {
  it('returns defaults for garbage', () => {
    expect(coerceProgress(null).schemaVersion).toBe(1)
    expect(coerceProgress('nope').xp).toBe(0)
    expect(coerceProgress({}).subjects.linux.rating).toBe(125)
  })

  it('preserves known fields and backfills missing ones', () => {
    const old = {
      xp: 500,
      subjects: { linux: { rating: 640, workingLevel: 3, placed: true } },
      streak: { current: 4 },
    }
    const p = coerceProgress(old)
    expect(p.xp).toBe(500)
    expect(p.subjects.linux.rating).toBe(640)
    expect(p.subjects.linux.correctStreak).toBe(0) // backfilled
    expect(p.subjects.docker.rating).toBe(125) // untouched subject gets defaults
    expect(p.streak.current).toBe(4)
    expect(p.streak.freezeTokens).toBe(1) // backfilled
    expect(p.counters).toEqual({})
  })

  it('round-trips a real progress object unchanged in the fields that matter', () => {
    const p0 = freshProgress()
    const p1 = coerceProgress(JSON.parse(JSON.stringify(p0)))
    expect(p1.subjects).toEqual(p0.subjects)
    expect(p1.xp).toBe(p0.xp)
  })
})

describe('coerceSettings', () => {
  it('merges partial settings onto defaults', () => {
    const s = coerceSettings({ name: 'X', dailyGoal: 5 })
    expect(s.name).toBe('X')
    expect(s.dailyGoal).toBe(5)
    expect(s.theme).toBe('dark')
  })
})

describe('backup', () => {
  it('strips the API key unless asked to include it', () => {
    const settings = { ...initialSettings(), anthropicApiKey: 'sk-ant-secret' }
    expect(buildBackup(freshProgress(), settings, false).settings.anthropicApiKey).toBeNull()
    expect(buildBackup(freshProgress(), settings, true).settings.anthropicApiKey).toBe('sk-ant-secret')
  })

  it('parses its own output', () => {
    const b = buildBackup(freshProgress(), initialSettings(), false)
    const { progress, settings } = parseBackup(JSON.stringify(b))
    expect(progress.subjects.linux.rating).toBe(125)
    expect(settings.name).toBe('Engineer')
  })

  it('rejects foreign or broken files', () => {
    expect(() => parseBackup('not json')).toThrow(BackupParseError)
    expect(() => parseBackup('{"app":"other"}')).toThrow(BackupParseError)
  })
})
