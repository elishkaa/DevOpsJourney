# DevOpsJourney 🛠️🔥

A personal, gamified, **AI-adaptive DevOps training site**. Every lesson is a real-world incident at
**NimbusPay** — a fictional fintech where things break in very educational ways. Fundamentals first,
served as daily on-call challenges.

**Live site:** `https://<your-login>.github.io/DevOpsJourney/`

## What's inside

- **10 subjects**, 190 hand-crafted challenges: Linux & Shell, Git, Networking, Docker, Kubernetes,
  CI/CD, IaC (Terraform/Ansible), Cloud/AWS, Observability, Security.
- **Adaptive difficulty** — a 5-question placement quiz per subject finds your level (Rookie →
  Operator → Engineer → Architect). Every answer moves an Elo-style rating (0–1000); promotion needs
  a rating threshold *plus* a correct streak, demotion is immediate below the floor, and a 50-point
  dead zone stops level flapping.
- **5 interaction types** — multiple choice, multi-select, order-the-steps, type-the-command
  (regex-graded), and spot-the-bug (click the broken config line).
- **Spaced repetition** — misses come back as reviews (SM-2 lite) until the concept retires as
  mastered.
- **Gamification** — XP with streak multipliers and speed bonuses, 40 subject tier badges
  (Bronze→Platinum, parametric SVG), 17 achievements, rank titles from *Boot Camp Cadet* to
  *Legend of the Pager*, confetti where deserved.
- **Daily shift** — slot 1 is the deterministic *Incident of the Day* (same pick the email links to),
  then due reviews, then new challenges from your least-practiced subjects.
- **AI Mentor (optional, BYO key)** — free-text incident debriefs graded by Claude,
  "explain like I'm stuck" on misses, and freshly generated challenges (schema-validated before they
  enter your bank). Everything else works with **no key and no backend**.
- **PWA** — installable, works offline after first load.

Progress lives in your browser's localStorage (`dj.*` keys) with JSON export/import backup in
Settings. No server, no accounts, no tracking.

## Local development

```bash
npm ci
npm run dev        # http://localhost:5173/DevOpsJourney/
npm test           # engine + content-bank test suite (watch)
npm run test:run   # one-shot
npm run build      # type-check + production build to dist/
npm run cotd       # render today's challenge email to mail.html
```

## Deployment (GitHub Pages)

Pushing to `main` runs `.github/workflows/deploy.yml`: install → **tests gate the deploy** → build →
publish to GitHub Pages. The workflow auto-enables Pages (build type: GitHub Actions) on its first
run. The repo can be public, or private on a paid plan (note: the published site URL itself remains
publicly reachable — Pages access control is Enterprise-only). The Vite `base` is `/DevOpsJourney/` —
if you fork/rename the repo, change `base` in `vite.config.ts` to match.

## Daily email (notify workflow)

`.github/workflows/notify.yml` sends the Challenge of the Day to your inbox at ~07:00 Asia/Jerusalem
(two UTC crons + a local-hour guard handle DST). It renders `scripts/cotd.mjs`, which shares the
day-key + pick logic with the app, so the email always matches slot 1 on your dashboard.

Required repo secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `MAIL_USERNAME` | your Gmail address |
| `MAIL_PASSWORD` | a Gmail **App Password** (not your real password) |
| `MAIL_TO` | where to send the challenge (usually the same address) |

Gmail App Password: Google Account → Security → 2-Step Verification (must be on) → App passwords →
create one for "Mail". Test the pipeline anytime with *Actions → notify → Run workflow*. First email
may land in spam — mark it "not spam" once. Note: GitHub cron can drift 5–30 minutes; read "07:00" as
"morning". Scheduled workflows pause after 60 days without repo activity — the workflow's keepalive
step counters this.

## Adding / editing challenges

Content lives in `src/content/challenges/<subject>.ts`. Each file starts with its **fundamentals
vocabulary** comment; every challenge declares one `fundamental` key (spaced repetition groups by
it). Conventions the test suite enforces (`tests/content.test.ts`):

- id: `<subject>-l<level>-slug`, unique; xp: 10/20/35/50 by level; estMinutes 1–6
- `command` answers: regex sources anchored `^(?:…)$`, matched after trimming, whitespace-collapse
  and stripping a leading `$ ` — and every `acceptExamples` entry must match your own patterns
- `spot`: `buggyLine` is 1-indexed and must exist in the snippet
- each subject: ≥6/5/4/3 challenges per level 1–4, exactly one `free` (AI Mentor) challenge, and at
  least one mcq/multi per level (the placement quiz needs them)

Adding content shifts the Challenge-of-the-Day rotation (pick is `hash(day) mod bank-size`) — the
pinned fixture test tells you to re-pin, which is expected.

The AI Mentor's generated challenges live in localStorage (`source: 'ai'`, id prefix `ai-`), never in
these files.

## AI Mentor key — security note

Your Anthropic API key is stored **only in this browser's localStorage** and sent **only to
api.anthropic.com** (direct browser calls with the `anthropic-dangerous-direct-browser-access`
header). Anyone with access to the device or a malicious extension could read it: use a key with a
low spend limit, and revoke it anytime at console.anthropic.com. The key is excluded from backup
exports unless you explicitly tick "include API key".

## Architecture

```
src/
├── engine/     pure, deterministic, unit-tested core
│   ├── rating.ts        Elo-lite updates + promotion/demotion hysteresis
│   ├── placement.ts     binary-search staircase calibration
│   ├── srs.ts           SM-2 lite spaced repetition
│   ├── selector.ts      daily set builder + COTD pool
│   ├── daily.ts         dayKey (Asia/Jerusalem) + deterministic COTD pick
│   ├── applyAttempt.ts  THE integration fn: grade → rating → xp → streak → srs → badges
│   └── …
├── content/    10 subject banks + zod schema + registry
├── store/      zustand + persist (versioned migrations, backup)
├── ai/         browser → Anthropic client, grader, explainer, generator
├── components/ ui, challenge player, dashboard, gamification
└── pages/      Dashboard · Player · Placement · SkillMap · Badges · Settings · Onboarding
```

Rebuilt daily state is intentionally frozen per day (`dailyCache`) so mid-day rating changes don't
reshuffle your shift. All engine functions take state in / return state out — see `tests/` for the
worked examples that double as specs.

## v2 seams (designed for, not built)

Gist-based cross-device sync of the backup JSON · a real push service for notifications ·
community content packs via the same zod pipeline · leaderboards if a backend ever appears.

---

Built with Vite + React + TypeScript + Tailwind, deployed by GitHub Actions, powered by stubbornness
and the NimbusPay on-call rotation. 🚨
