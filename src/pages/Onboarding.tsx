import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SUBJECT_LIST } from '../content/subjects'
import { useSettingsStore } from '../store/settingsStore'
import Button from '../components/ui/Button'

export default function Onboarding() {
  const navigate = useNavigate()
  const settings = useSettingsStore((s) => s.settings)
  const update = useSettingsStore((s) => s.update)
  const [step, setStep] = useState(0)
  const [name, setName] = useState(settings.name)
  const [notifState, setNotifState] = useState<string>(
    'Notification' in window ? Notification.permission : 'unsupported',
  )

  const askNotifications = async () => {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    setNotifState(perm)
    if (perm === 'granted') update({ notificationsEnabled: true })
  }

  const finish = (subjectId?: string) => {
    update({ name: name.trim() || 'Engineer', onboarded: true })
    navigate(subjectId ? `/placement/${subjectId}` : '/', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-brand' : 'w-4 bg-line'}`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="card dj-rise p-8 text-center">
            <svg viewBox="0 0 64 64" className="mx-auto h-16 w-16">
              <rect x="2" y="2" width="60" height="60" rx="14" fill="#0b1220" stroke="#223052" strokeWidth="2" />
              <path d="M18 22 L30 32 L18 42" fill="none" stroke="#2dd4bf" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="34" y1="44" x2="48" y2="44" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
            </svg>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">
              DevOps<span className="text-brand">Journey</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
              Welcome to the on-call rotation at <strong className="text-ink">NimbusPay</strong> — a fictional
              fintech where things break in very educational ways. Daily incidents, adaptive difficulty, real
              fundamentals.
            </p>
            <div className="mx-auto mt-6 max-w-xs">
              <label className="mb-1 block text-left text-xs text-muted">What should the pager call you?</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-line bg-base px-3 py-2 text-sm outline-none focus:border-brand/60"
                placeholder="Your name"
              />
            </div>
            <Button className="mt-6" size="lg" onClick={() => setStep(1)}>
              Join the rotation →
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="card dj-rise p-8">
            <h2 className="text-center text-xl font-bold">How your training works</h2>
            <div className="mt-6 space-y-4">
              {[
                {
                  icon: '🎯',
                  title: 'It adapts to you',
                  body: 'A quick placement quiz finds your level per subject. Every answer moves your rating — win streaks promote you, struggles ease things down. No wasted time on stuff you know.',
                },
                {
                  icon: '🚨',
                  title: 'Real-world first',
                  body: 'No dry theory quizzes. You get tickets and 3am pages: broken YAML, full disks, crashlooping pods. Each one teaches the fundamental behind the fix.',
                },
                {
                  icon: '🔥',
                  title: 'Streaks, XP & badges',
                  body: 'Daily challenges keep a streak alive (freeze tokens forgive one miss). Wrong answers come back as spaced reviews until the concept sticks — that’s a feature, not a punishment.',
                },
              ].map((f) => (
                <div key={f.title} className="flex gap-4 rounded-xl border border-line bg-base p-4">
                  <span className="text-2xl">{f.icon}</span>
                  <div>
                    <p className="font-semibold">{f.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between rounded-xl border border-line bg-base p-4">
              <div>
                <p className="text-sm font-medium">Browser reminders</p>
                <p className="text-xs text-muted">Streak warnings & review nudges when the app is open.</p>
              </div>
              {notifState === 'granted' ? (
                <span className="text-sm text-ok">enabled ✓</span>
              ) : notifState === 'unsupported' ? (
                <span className="text-xs text-faint">not supported here</span>
              ) : (
                <Button variant="ghost" size="sm" onClick={askNotifications}>
                  Enable
                </Button>
              )}
            </div>
            <div className="mt-6 text-center">
              <Button size="lg" onClick={() => setStep(2)}>
                Got it →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card dj-rise p-8">
            <h2 className="text-center text-xl font-bold">Pick your first subject</h2>
            <p className="mt-1 text-center text-sm text-muted">
              A 5-question placement finds your level. You can place into other subjects anytime.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SUBJECT_LIST.map((s) => (
                <button
                  key={s.id}
                  onClick={() => finish(s.id)}
                  className="card cursor-pointer p-4 text-left transition-all hover:border-line-strong hover:bg-raised"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: s.color }}
                  />
                  <p className="mt-2 text-sm font-semibold">{s.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{s.blurb}</p>
                </button>
              ))}
            </div>
            <p className="mt-5 text-center">
              <button onClick={() => finish()} className="cursor-pointer text-xs text-faint hover:text-muted">
                skip for now — I’ll explore first
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
