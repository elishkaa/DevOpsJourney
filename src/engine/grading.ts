import type { Challenge } from '../types/challenge'

export type Answer =
  | { type: 'mcq'; index: number }
  | { type: 'multi'; indices: number[] }
  | { type: 'order'; sequence: number[] } // indices into the ORIGINAL steps array, in user order
  | { type: 'command'; text: string }
  | { type: 'spot'; line: number }
  | { type: 'free'; text: string; aiScore?: number } // aiScore set by the mentor grader

export interface Graded {
  correct: boolean
  /** 0..1 — fractional only for AI-graded free text */
  score: number
  /** Extra detail for the result UI */
  detail?: string
}

/** Normalize a shell command for fuzzy comparison */
export function normalizeCommand(text: string): string {
  return text
    .trim()
    .replace(/^\$\s*/, '') // strip leading "$ " prompt
    .replace(/\s+/g, ' ')
}

export function grade(challenge: Challenge, answer: Answer): Graded {
  switch (challenge.type) {
    case 'mcq': {
      if (answer.type !== 'mcq') return { correct: false, score: 0 }
      const correct = answer.index === challenge.correctIndex
      return { correct, score: correct ? 1 : 0 }
    }
    case 'multi': {
      if (answer.type !== 'multi') return { correct: false, score: 0 }
      const want = new Set(challenge.correctIndices)
      const got = new Set(answer.indices)
      const correct = want.size === got.size && [...want].every((i) => got.has(i))
      return { correct, score: correct ? 1 : 0 }
    }
    case 'order': {
      if (answer.type !== 'order') return { correct: false, score: 0 }
      const correct =
        answer.sequence.length === challenge.steps.length &&
        answer.sequence.every((stepIndex, position) => stepIndex === position)
      return { correct, score: correct ? 1 : 0 }
    }
    case 'command': {
      if (answer.type !== 'command') return { correct: false, score: 0 }
      const norm = normalizeCommand(answer.text)
      if (norm.length === 0) return { correct: false, score: 0 }
      const correct = challenge.answerPatterns.some((p) => {
        try {
          return new RegExp(`^(?:${p})$`).test(norm)
        } catch {
          return false
        }
      })
      return { correct, score: correct ? 1 : 0 }
    }
    case 'spot': {
      if (answer.type !== 'spot') return { correct: false, score: 0 }
      const ok = new Set([challenge.buggyLine, ...(challenge.acceptableLines ?? [])])
      const correct = ok.has(answer.line)
      return { correct, score: correct ? 1 : 0 }
    }
    case 'free': {
      if (answer.type !== 'free') return { correct: false, score: 0 }
      // Without AI grading a free challenge cannot be auto-graded; the UI only
      // serves 'free' challenges when the mentor is enabled.
      const score = answer.aiScore ?? 0
      return { correct: score >= 0.7, score }
    }
  }
}
