import type { Settings } from '../types/settings'

export type AiErrorKind = 'auth' | 'busy' | 'network' | 'bad-response'

export class AiError extends Error {
  kind: AiErrorKind
  constructor(kind: AiErrorKind, message: string) {
    super(message)
    this.kind = kind
  }
}

export function friendlyAiError(e: unknown): string {
  if (e instanceof AiError) {
    switch (e.kind) {
      case 'auth':
        return 'API key invalid — check it in Settings.'
      case 'busy':
        return 'Claude is busy right now, try again in a moment.'
      case 'network':
        return 'Network error — are you offline?'
      case 'bad-response':
        return 'The mentor answered in an unexpected format.'
    }
  }
  return 'Something went wrong talking to the mentor.'
}

interface CallOpts {
  system: string
  user: string
  maxTokens: number
}

/**
 * Direct browser → Anthropic Messages API call using the user's own key.
 * The key travels ONLY to api.anthropic.com. One automatic retry on 429/529.
 */
export async function callClaude(settings: Settings, opts: CallOpts): Promise<string> {
  if (!settings.anthropicApiKey) throw new AiError('auth', 'No API key configured')

  const doFetch = async (): Promise<Response> => {
    try {
      return await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': settings.anthropicApiKey!,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: settings.aiModel,
          max_tokens: opts.maxTokens,
          system: opts.system,
          messages: [{ role: 'user', content: opts.user }],
        }),
      })
    } catch {
      throw new AiError('network', 'fetch failed')
    }
  }

  let res = await doFetch()
  if (res.status === 429 || res.status === 529) {
    await new Promise((r) => setTimeout(r, 2000))
    res = await doFetch()
  }
  if (res.status === 401 || res.status === 403) throw new AiError('auth', `HTTP ${res.status}`)
  if (res.status === 429 || res.status === 529) throw new AiError('busy', `HTTP ${res.status}`)
  if (!res.ok) throw new AiError('bad-response', `HTTP ${res.status}`)

  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> }
  const text = data.content?.filter((b) => b.type === 'text').map((b) => b.text ?? '').join('') ?? ''
  if (!text) throw new AiError('bad-response', 'empty completion')
  return text
}

/** Strip accidental markdown fences around a JSON payload. */
export function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()
}
