import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings } from '../types/settings'
import { initialSettings } from '../types/settings'
import { coerceSettings, migratePersistedSettings } from './migrations'

interface SettingsState {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  importSettings: (raw: unknown) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: initialSettings(),
      update: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      importSettings: (raw) => set(() => ({ settings: coerceSettings(raw) })),
      reset: () => set(() => ({ settings: initialSettings() })),
    }),
    {
      name: 'dj.settings',
      version: 1,
      partialize: (s) => ({ settings: s.settings }),
      migrate: (persisted) => migratePersistedSettings(persisted),
    },
  ),
)

/** Apply theme + reduced-motion classes to <html>. Call on boot and on change. */
export function applyThemeToDocument(settings: Settings): void {
  const root = document.documentElement
  const dark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.classList.toggle('light', !dark)
  const reduced =
    settings.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  root.classList.toggle('reduced-motion', reduced)
}
