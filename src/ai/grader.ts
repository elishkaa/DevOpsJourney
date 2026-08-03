import { z } from 'zod'
import type { FreeChallenge } from '../types/challenge'
import type { Settings } from '../types/settings'
import { AiError, callClaude, stripFences } from './client'
import { GRADER_SYSTEM, graderUser } from './prompts'

const verdictSchema = z.object({
  verdict: z.enum(['correct', 'partial', 'incorrect']),
  score: z.number().min(0).max(1),
  feedback: z.string().min(1),
})

export type FreeTextVerdict = z.infer<typeof verdictSchema>

/** Grade a free-text answer via the mentor. Retries once with a JSON-only nudge. */
export async function gradeFreeText(
  settings: Settings,
  challenge: FreeChallenge,
  answer: string,
): Promise<FreeTextVerdict> {
  const ask = (extra: string) =>
    callClaude(settings, {
      system: GRADER_SYSTEM,
      user: graderUser(challenge, answer) + extra,
      maxTokens: 700,
    })

  let text = await ask('')
  let parsed = verdictSchema.safeParse(tryJson(stripFences(text)))
  if (!parsed.success) {
    text = await ask('\n\nREMINDER: respond with the JSON object ONLY. No prose. No code fences.')
    parsed = verdictSchema.safeParse(tryJson(stripFences(text)))
  }
  if (!parsed.success) throw new AiError('bad-response', 'grader returned non-JSON')
  return parsed.data
}

function tryJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
