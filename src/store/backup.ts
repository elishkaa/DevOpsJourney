import type { UserProgress } from '../types/progress'
import type { Settings } from '../types/settings'
import { coerceProgress, coerceSettings } from './migrations'

export interface BackupFile {
  app: 'devops-journey'
  exportedAt: string
  progress: UserProgress
  settings: Settings
}

export function buildBackup(progress: UserProgress, settings: Settings, includeApiKey: boolean): BackupFile {
  return {
    app: 'devops-journey',
    exportedAt: new Date().toISOString(),
    progress,
    settings: includeApiKey ? settings : { ...settings, anthropicApiKey: null },
  }
}

export class BackupParseError extends Error {}

export function parseBackup(json: string): { progress: UserProgress; settings: Settings } {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new BackupParseError('Not valid JSON')
  }
  if (!raw || typeof raw !== 'object' || (raw as { app?: string }).app !== 'devops-journey') {
    throw new BackupParseError('Not a DevOpsJourney backup file')
  }
  const r = raw as Partial<BackupFile>
  return { progress: coerceProgress(r.progress), settings: coerceSettings(r.settings) }
}

/** Trigger a browser download of the backup JSON. */
export function downloadBackup(backup: BackupFile): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `devops-journey-backup-${backup.exportedAt.slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
