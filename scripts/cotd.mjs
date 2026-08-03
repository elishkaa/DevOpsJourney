/**
 * Challenge-of-the-Day email renderer.
 * Run with: npx tsx scripts/cotd.mjs   (tsx lets us import the app's TS modules)
 *
 * Determinism contract: uses the SAME dayKey + pickCotd + sorted seed bank as
 * the browser app, so the emailed challenge always matches slot 1 in the UI.
 *
 * Outputs:
 *   - mail.html (in CWD)
 *   - appends subject=... to $GITHUB_OUTPUT when set (for the send-mail step)
 */
import { appendFileSync, writeFileSync } from 'node:fs'
import { SEED_BANK } from '../src/content/index'
import { SUBJECTS } from '../src/content/subjects'
import { dayKey, pickCotd } from '../src/engine/daily'
import { cotdPool } from '../src/engine/selector'
import { xmur3 } from '../src/engine/rng'
import { LEVEL_NAMES } from '../src/types/challenge'

const TIPS = [
  'Read the error message. Then read it again — slower.',
  'cat -A shows the invisible characters that ruin YAML lives.',
  'Every alert should be actionable. If it isn’t, tune it or delete it.',
  '`history | grep` is the poor man’s runbook. Write the real runbook.',
  'Backups you haven’t restored are Schrödinger’s backups.',
  'The best incident is the one your rate limit prevented.',
  'Blame the process, fix the system, thank the person who found it.',
  'If you SSH to fix it, automate it before you log out.',
  'Tags are opinions. Digests are facts.',
  'Slow is smooth, smooth is fast — especially in prod.',
  'A TODO in a runbook is an outage with a scheduled date.',
  'Monitoring tells you it’s broken. Observability tells you why.',
  'Never deploy anything you can’t roll back before your coffee cools.',
  'The second-best time to add a healthcheck was before the incident.',
]

const today = dayKey(new Date())
const pool = cotdPool(SEED_BANK)
const id = pickCotd(today, pool)
const c = SEED_BANK.find((x) => x.id === id)
if (!c) throw new Error(`COTD id not found in bank: ${id}`)

const repo = process.env.GITHUB_REPOSITORY // "owner/repo" inside Actions
const siteUrl = repo
  ? `https://${repo.split('/')[0]}.github.io/${repo.split('/')[1]}/`
  : process.env.SITE_URL ?? ''
const deepLink = siteUrl ? `${siteUrl}#/challenge/${id}?src=daily` : '#'

const meta = SUBJECTS[c.subject]
const tip = TIPS[xmur3(`tip:${today}`) % TIPS.length]
const sev = { 1: 'SEV-4', 2: 'SEV-3', 3: 'SEV-2', 4: 'SEV-1' }[c.level]
const scenarioTeaser =
  c.scenario
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[*`#>]/g, '')
    .trim()
    .slice(0, 220) + '…'

const subjectLine = `🚨 ${c.title.split(': ')[0]}: today's ${meta.short} challenge is live`

const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#0b1220;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <p style="color:#5c6d8f;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;">DevOpsJourney · ${today}</p>
    <h1 style="color:#e8eefb;font-size:22px;margin:0 0 20px;">Your daily incident just paged.</h1>

    <div style="background:#111a2e;border:1px solid #223052;border-radius:14px;padding:20px;">
      <p style="margin:0 0 10px;">
        <span style="display:inline-block;background:rgba(248,113,113,.12);color:#f87171;border:1px solid rgba(248,113,113,.4);border-radius:99px;padding:2px 10px;font-size:11px;font-weight:600;">${sev}</span>
        <span style="display:inline-block;background:rgba(45,212,191,.12);color:${meta.color};border:1px solid ${meta.color}66;border-radius:99px;padding:2px 10px;font-size:11px;font-weight:600;margin-left:6px;">${meta.name}</span>
        <span style="display:inline-block;color:#93a4c4;font-size:11px;margin-left:6px;">L${c.level} · ${LEVEL_NAMES[c.level]} · ~${c.estMinutes} min</span>
      </p>
      <h2 style="color:#e8eefb;font-size:17px;margin:0 0 8px;line-height:1.4;">${c.title}</h2>
      <p style="color:#93a4c4;font-size:14px;line-height:1.6;margin:0 0 18px;">${scenarioTeaser}</p>
      <a href="${deepLink}" style="display:inline-block;background:#2dd4bf;color:#06201c;text-decoration:none;font-weight:700;font-size:14px;padding:11px 22px;border-radius:12px;">Take the challenge →</a>
    </div>

    <div style="background:#111a2e;border:1px solid #223052;border-radius:14px;padding:14px 20px;margin-top:14px;">
      <p style="color:#93a4c4;font-size:13px;margin:0;"><span style="color:#f5b93c;">⚡ Tip of the day:</span> ${tip}</p>
    </div>

    <p style="color:#5c6d8f;font-size:11px;line-height:1.6;margin:20px 4px 0;">
      Your streak &amp; progress live in your browser — open the app to log today.
      This email is sent by the <em>notify</em> workflow in your own GitHub repo; edit
      <code style="color:#93a4c4;">.github/workflows/notify.yml</code> to change the time, or disable the workflow to stop.
    </p>
  </div>
</body>
</html>`

writeFileSync('mail.html', html)
console.log(`COTD ${today}: ${id}`)
console.log(`subject: ${subjectLine}`)
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `subject=${subjectLine}\n`)
  appendFileSync(process.env.GITHUB_OUTPUT, `cotd_id=${id}\n`)
}
