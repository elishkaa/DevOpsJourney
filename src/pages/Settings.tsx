import { useRef, useState } from 'react'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import { buildBackup, downloadBackup, parseBackup, BackupParseError } from '../store/backup'
import { callClaude, friendlyAiError } from '../ai/client'
import { BUDGET_AI_MODEL, DEFAULT_AI_MODEL } from '../types/settings'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="mt-0.5 max-w-md text-xs text-muted">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

const inputCls =
  'rounded-xl border border-line bg-base px-3 py-2 text-sm outline-none focus:border-brand/60 placeholder:text-faint'

export default function Settings() {
  const settings = useSettingsStore((s) => s.settings)
  const update = useSettingsStore((s) => s.update)
  const importSettings = useSettingsStore((s) => s.importSettings)
  const progress = useProgressStore((s) => s.progress)
  const importProgress = useProgressStore((s) => s.importProgress)
  const resetAll = useProgressStore((s) => s.resetAll)

  const [showKey, setShowKey] = useState(false)
  const [keyDraft, setKeyDraft] = useState(settings.anthropicApiKey ?? '')
  const [testState, setTestState] = useState<string | null>(null)
  const [includeKeyInExport, setIncludeKeyInExport] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const notifPermission = 'Notification' in window ? Notification.permission : 'unsupported'

  const saveKey = () => {
    const v = keyDraft.trim()
    update({ anthropicApiKey: v === '' ? null : v })
    setTestState(v === '' ? null : 'saved — hit “Test key” to verify')
  }

  const testKey = async () => {
    setTestState('testing…')
    try {
      await callClaude(
        { ...settings, anthropicApiKey: keyDraft.trim() || settings.anthropicApiKey },
        { system: 'Reply with exactly: ok', user: 'ping', maxTokens: 8 },
      )
      setTestState('✓ key works — the mentor is awake')
    } catch (e) {
      setTestState(friendlyAiError(e))
    }
  }

  const onImportFile = async (file: File) => {
    try {
      const { progress: p, settings: s } = parseBackup(await file.text())
      importProgress(p)
      importSettings(s)
      setImportMsg('✓ backup restored')
    } catch (e) {
      setImportMsg(e instanceof BackupParseError ? e.message : 'Import failed')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-bold">Settings</h1>

      <Section title="Profile">
        <Row label="Name">
          <input className={inputCls} value={settings.name} onChange={(e) => update({ name: e.target.value })} />
        </Row>
        <Row label="Daily goal" hint="Challenges per day, including the Incident of the Day.">
          <select
            className={inputCls}
            value={settings.dailyGoal}
            onChange={(e) => update({ dailyGoal: Number(e.target.value) })}
          >
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} / day
              </option>
            ))}
          </select>
        </Row>
        <Row label="Theme">
          <select
            className={inputCls}
            value={settings.theme}
            onChange={(e) => update({ theme: e.target.value as 'dark' | 'light' | 'system' })}
          >
            <option value="dark">Dark (ops terminal)</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </Row>
        <Row label="Reduce motion" hint="Disables confetti and animations.">
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => update({ reducedMotion: e.target.checked })}
            className="h-4 w-4 accent-(--c-brand)"
          />
        </Row>
      </Section>

      <Section title="AI Mentor">
        <Row
          label="Anthropic API key"
          hint="Unlocks free-text grading, personal explanations and generated challenges."
        >
          <div className="flex items-center gap-2">
            <input
              type={showKey ? 'text' : 'password'}
              className={`${inputCls} w-56`}
              placeholder="sk-ant-…"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
            />
            <Button variant="ghost" size="sm" onClick={() => setShowKey((v) => !v)}>
              {showKey ? 'hide' : 'show'}
            </Button>
          </div>
        </Row>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={saveKey}>
            Save key
          </Button>
          <Button size="sm" variant="ghost" onClick={testKey} disabled={!keyDraft.trim() && !settings.anthropicApiKey}>
            Test key
          </Button>
          {testState && <span className="text-xs text-muted">{testState}</span>}
        </div>
        <Row label="Model" hint={`Default ${DEFAULT_AI_MODEL}; ${BUDGET_AI_MODEL} is the budget option.`}>
          <input className={`${inputCls} w-56`} value={settings.aiModel} onChange={(e) => update({ aiModel: e.target.value })} />
        </Row>
        <p className="rounded-lg border border-warn/30 bg-warn-soft p-3 text-xs leading-relaxed text-muted">
          🔐 Your key is stored only in this browser’s localStorage and sent only to api.anthropic.com. Anyone
          with access to this device or a malicious browser extension could read it. Use a key with a low
          spend limit and revoke it anytime at console.anthropic.com.
        </p>
      </Section>

      <Section title="Notifications">
        <Row
          label="Browser notifications"
          hint={
            notifPermission === 'granted'
              ? 'Streak warnings and review reminders fire while the app is open.'
              : notifPermission === 'denied'
                ? 'Blocked by the browser — allow notifications for this site in the address-bar settings.'
                : 'Permission is requested when you enable.'
          }
        >
          {notifPermission === 'unsupported' ? (
            <span className="text-xs text-faint">unsupported</span>
          ) : (
            <input
              type="checkbox"
              checked={settings.notificationsEnabled && notifPermission === 'granted'}
              onChange={async (e) => {
                if (e.target.checked) {
                  const perm = await Notification.requestPermission()
                  update({ notificationsEnabled: perm === 'granted' })
                } else {
                  update({ notificationsEnabled: false })
                }
              }}
              className="h-4 w-4 accent-(--c-brand)"
            />
          )}
        </Row>
        <Row label="Streak reminder after" hint="If you haven’t trained yet, nudge from this hour.">
          <select
            className={inputCls}
            value={settings.reminderHour}
            onChange={(e) => update({ reminderHour: Number(e.target.value) })}
          >
            {[16, 17, 18, 19, 20, 21].map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </Row>
        <p className="text-xs text-faint">
          The daily challenge email is configured in the GitHub repo (see README) — it works even when the
          site is closed.
        </p>
      </Section>

      <Section title="Data">
        <Row label="Export backup" hint="Progress + settings as a JSON file. Keep it somewhere safe.">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-muted">
              <input
                type="checkbox"
                checked={includeKeyInExport}
                onChange={(e) => setIncludeKeyInExport(e.target.checked)}
                className="h-3.5 w-3.5 accent-(--c-brand)"
              />
              include API key
            </label>
            <Button size="sm" onClick={() => downloadBackup(buildBackup(progress, settings, includeKeyInExport))}>
              Export
            </Button>
          </div>
        </Row>
        <Row label="Import backup" hint="Replaces current progress and settings.">
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onImportFile(f)
                e.target.value = ''
              }}
            />
            <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()}>
              Choose file…
            </Button>
            {importMsg && <span className="text-xs text-muted">{importMsg}</span>}
          </div>
        </Row>
        <Row label="Reset everything" hint="Wipes all progress, badges and streaks. No undo.">
          <Button size="sm" variant="danger" onClick={() => setConfirmReset(true)}>
            Reset…
          </Button>
        </Row>
      </Section>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)}>
        <p className="text-lg font-bold">Wipe all progress?</p>
        <p className="mt-2 text-sm text-muted">
          Streak, XP, badges, ratings, review queue — everything goes. Export a backup first if in doubt.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmReset(false)}>
            Keep my progress
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              resetAll()
              setConfirmReset(false)
            }}
          >
            Yes, wipe it
          </Button>
        </div>
      </Modal>
    </div>
  )
}
