import { z } from 'zod'
import type { Challenge } from '../types/challenge'
import { SUBJECT_IDS } from '../types/progress'

const base = {
  id: z.string().min(3).regex(/^[a-z0-9-]+$/, 'id must be kebab-case'),
  subject: z.enum(SUBJECT_IDS as [string, ...string[]]),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  title: z.string().min(4),
  scenario: z.string().min(10),
  artifact: z.string().optional(),
  artifactLang: z.enum(['bash', 'yaml', 'dockerfile', 'hcl', 'json', 'ini', 'text']).optional(),
  prompt: z.string().min(4),
  explanation: z.string().min(20),
  fundamental: z.string().min(2),
  xp: z.number().int().min(1).max(100),
  tags: z.array(z.string()).min(1),
  estMinutes: z.number().min(1).max(6),
  source: z.enum(['seed', 'ai']),
}

const artifactLangEnum = z.enum(['bash', 'yaml', 'dockerfile', 'hcl', 'json', 'ini', 'text'])

const mcqSchema = z.object({
  ...base,
  type: z.literal('mcq'),
  options: z.array(z.string().min(1)).min(3).max(5),
  correctIndex: z.number().int().min(0),
}).refine((c) => c.correctIndex < c.options.length, { message: 'correctIndex out of range' })

const multiSchema = z.object({
  ...base,
  type: z.literal('multi'),
  options: z.array(z.string().min(1)).min(3).max(6),
  correctIndices: z.array(z.number().int().min(0)).min(1),
}).refine(
  (c) =>
    c.correctIndices.every((i) => i < c.options.length) &&
    new Set(c.correctIndices).size === c.correctIndices.length,
  { message: 'correctIndices must be unique and in range' },
)

const orderSchema = z.object({
  ...base,
  type: z.literal('order'),
  steps: z.array(z.string().min(1)).min(3).max(7),
})

const commandSchema = z.object({
  ...base,
  type: z.literal('command'),
  answerPatterns: z.array(z.string().min(1)).min(1),
  acceptExamples: z.array(z.string().min(1)).min(1),
  placeholder: z.string().optional(),
  hint: z.string().optional(),
}).superRefine((c, ctx) => {
  for (const p of c.answerPatterns) {
    try {
      new RegExp(p)
    } catch {
      ctx.addIssue({ code: 'custom', message: `answerPattern does not compile: ${p}` })
    }
  }
})

const spotSchema = z.object({
  ...base,
  type: z.literal('spot'),
  snippet: z.string().min(10),
  snippetLang: artifactLangEnum,
  buggyLine: z.number().int().min(1),
  acceptableLines: z.array(z.number().int().min(1)).optional(),
}).superRefine((c, ctx) => {
  const lines = c.snippet.split('\n').length
  if (c.buggyLine > lines) {
    ctx.addIssue({ code: 'custom', message: `buggyLine ${c.buggyLine} > snippet lines ${lines}` })
  }
  for (const l of c.acceptableLines ?? []) {
    if (l > lines) ctx.addIssue({ code: 'custom', message: `acceptableLine ${l} > snippet lines ${lines}` })
  }
})

const freeSchema = z.object({
  ...base,
  type: z.literal('free'),
  rubric: z.string().min(10),
  modelAnswer: z.string().min(10),
})

export const challengeSchema = z.discriminatedUnion('type', [
  mcqSchema,
  multiSchema,
  orderSchema,
  commandSchema,
  spotSchema,
  freeSchema,
])

export type ParsedChallenge = z.infer<typeof challengeSchema>

/** Parse an untrusted object (e.g. AI-generated) into a Challenge, or throw. */
export function parseChallenge(raw: unknown): Challenge {
  return challengeSchema.parse(raw) as Challenge
}

export interface BankIssue {
  id: string
  message: string
}

/** Validate a whole bank: schema per item + unique ids. (Command self-match is asserted in tests via engine/grading.) */
export function validateBank(bank: Challenge[]): BankIssue[] {
  const issues: BankIssue[] = []
  const seen = new Set<string>()
  for (const c of bank) {
    const res = challengeSchema.safeParse(c)
    if (!res.success) {
      issues.push({ id: c.id ?? '(missing id)', message: res.error.issues.map((i) => i.message).join('; ') })
      continue
    }
    if (seen.has(c.id)) issues.push({ id: c.id, message: 'duplicate id' })
    seen.add(c.id)
  }
  return issues
}
