import type { Challenge, ChallengeLevel, SubjectId } from '../types/challenge'
import type { Settings } from '../types/settings'
import { challengeSchema } from '../content/schema'
import { LEVEL_THEMES } from '../content/levelThemes'
import { AiError, callClaude, stripFences } from './client'
import { GENERATOR_SYSTEM, generatorUser } from './prompts'

const SCHEMA_EXAMPLE = JSON.stringify(
  {
    id: 'ai-docker-l2-example-slug',
    subject: 'docker',
    level: 2,
    type: 'mcq',
    title: 'INC-3041: staging build suddenly takes 9 minutes',
    scenario: 'You are on call at NimbusPay. Dana pings you: …',
    artifact: 'FROM node:20\nCOPY . .\nRUN npm ci',
    artifactLang: 'dockerfile',
    prompt: 'What causes the slowdown?',
    options: ['…', '…', '…', '…'],
    correctIndex: 0,
    explanation: 'Teaches the fundamental first, then the fix. ≤150 words.',
    fundamental: 'layer-caching',
    xp: 20,
    tags: ['dockerfile', 'cache'],
    estMinutes: 2,
    source: 'ai',
  },
  null,
  1,
)

export interface GenerationResult {
  valid: Challenge[]
  droppedCount: number
}

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

/** Generate 3 fresh challenges for a subject+level; zod-validate; never trust the model. */
export async function generateChallenges(
  settings: Settings,
  subject: SubjectId,
  level: ChallengeLevel,
  existing: Challenge[],
): Promise<GenerationResult> {
  const existingTitles = existing
    .filter((c) => c.subject === subject)
    .map((c) => `${c.title} [${c.fundamental}]`)
    .slice(0, 40)

  const text = await callClaude(settings, {
    system: GENERATOR_SYSTEM,
    user: generatorUser(subject, level, LEVEL_THEMES[subject][level], existingTitles, SCHEMA_EXAMPLE),
    maxTokens: 4096,
  })

  let raw: unknown
  try {
    raw = JSON.parse(stripFences(text))
  } catch {
    throw new AiError('bad-response', 'generator returned non-JSON')
  }
  if (!Array.isArray(raw)) throw new AiError('bad-response', 'generator did not return an array')

  const existingIds = new Set(existing.map((c) => c.id))
  const valid: Challenge[] = []
  let droppedCount = 0

  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      droppedCount++
      continue
    }
    const obj = item as Record<string, unknown>
    // Force invariants regardless of what the model said
    obj.subject = subject
    obj.level = level
    obj.source = 'ai'
    const slugSource = typeof obj.id === 'string' && obj.id ? obj.id : String(obj.title ?? 'challenge')
    let id = `ai-${subject}-l${level}-${slugify(slugSource.replace(/^ai-[a-z]+-l\d-/, ''))}`
    let n = 2
    while (existingIds.has(id) || valid.some((v) => v.id === id)) id = `${id.slice(0, 60)}-${n++}`
    obj.id = id

    const parsed = challengeSchema.safeParse(obj)
    if (!parsed.success) {
      droppedCount++
      continue
    }
    valid.push(parsed.data as Challenge)
  }

  return { valid, droppedCount }
}
