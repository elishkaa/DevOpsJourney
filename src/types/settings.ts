export interface Settings {
  schemaVersion: 1
  name: string
  onboarded: boolean
  /** Stored in this browser's localStorage only; sent only to api.anthropic.com */
  anthropicApiKey: string | null
  aiModel: string
  notificationsEnabled: boolean
  /** Local hour (0–23) after which a streak-at-risk nudge may fire */
  reminderHour: number
  /** Challenges per day in the daily set (including COTD) */
  dailyGoal: number
  theme: 'dark' | 'light' | 'system'
  soundEnabled: boolean
  reducedMotion: boolean
}

export const DEFAULT_AI_MODEL = 'claude-sonnet-4-5'
export const BUDGET_AI_MODEL = 'claude-haiku-4-5'

export function initialSettings(): Settings {
  return {
    schemaVersion: 1,
    name: 'Engineer',
    onboarded: false,
    anthropicApiKey: null,
    aiModel: DEFAULT_AI_MODEL,
    notificationsEnabled: false,
    reminderHour: 19,
    dailyGoal: 3,
    theme: 'dark',
    soundEnabled: true,
    reducedMotion: false,
  }
}
