import type { Challenge, FreeChallenge, SubjectId } from '../types/challenge'
import { LEVEL_NAMES } from '../types/challenge'

export const GRADER_SYSTEM = `You are a strict but fair senior SRE grading a junior engineer's answer at NimbusPay, a fintech scale-up. You grade for operational correctness: would this answer actually work in production? Partial credit for right direction with wrong specifics. Respond with JSON ONLY — no prose, no code fences.`

export function graderUser(challenge: FreeChallenge, answer: string): string {
  return [
    `## Scenario\n${challenge.scenario}`,
    `## Question\n${challenge.prompt}`,
    `## Grading rubric\n${challenge.rubric}`,
    `## Model answer (for your reference)\n${challenge.modelAnswer}`,
    `## The engineer's answer\n${answer}`,
    `## Output format\nRespond with exactly this JSON shape and nothing else:\n{"verdict":"correct"|"partial"|"incorrect","score":0.0-1.0,"feedback":"2-4 sentences of specific feedback, naming what was right and what was missing"}`,
  ].join('\n\n')
}

export const EXPLAINER_SYSTEM = `You are a patient senior DevOps mentor at NimbusPay. A junior engineer just answered a training challenge incorrectly. Explain the underlying concept so the misconception can't survive. Max 200 words. End with one memorable rule of thumb on its own line starting with "Rule of thumb:". Plain text with optional **bold** and \`code\`, no headers.`

export function explainerUser(challenge: Challenge, userAnswer: string, band: 1 | 2 | 3 | 4): string {
  const correct = describeCorrectAnswer(challenge)
  return [
    `## Challenge (${challenge.subject}, level ${challenge.level})\n${challenge.scenario}\n\nQuestion: ${challenge.prompt}`,
    challenge.artifact ? `## Artifact\n${challenge.artifact}` : '',
    `## Correct answer\n${correct}`,
    `## What the engineer answered\n${userAnswer}`,
    `## Engineer's current level in this subject\n${LEVEL_NAMES[band]} — pitch the explanation to that level.`,
    `## Stock explanation already shown\n${challenge.explanation}\n\nDo NOT repeat it — target the specific gap between their answer and the correct one.`,
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function describeCorrectAnswer(challenge: Challenge): string {
  switch (challenge.type) {
    case 'mcq':
      return challenge.options[challenge.correctIndex]
    case 'multi':
      return challenge.correctIndices.map((i) => challenge.options[i]).join(' AND ')
    case 'order':
      return challenge.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
    case 'command':
      return challenge.acceptExamples[0]
    case 'spot':
      return `Line ${challenge.buggyLine}: ${challenge.snippet.split('\n')[challenge.buggyLine - 1]}`
    case 'free':
      return challenge.modelAnswer
  }
}

export const GENERATOR_SYSTEM = `You author training challenges for DevOpsJourney, a gamified DevOps learning app. All challenges live in a shared fictional universe: NimbusPay, a fintech scale-up (payments-api on Kubernetes, checkout-web, ledger-db Postgres, Grafana/Prometheus, GitHub Actions CI, Terraform on AWS eu-west-1). Cast: Maya (team lead), Tomer (backend dev), Dana (SRE). Titles are ticket-style: "INC-xxxx: …" or "OPS-xxxx: …". Scenarios are on-call narratives. Explanations teach the FUNDAMENTAL principle first, then the fix, ≤150 words. Respond with a raw JSON array ONLY — no prose, no code fences.`

export function generatorUser(
  subject: SubjectId,
  level: 1 | 2 | 3 | 4,
  levelTheme: string,
  existingTitles: string[],
  schemaExample: string,
): string {
  return [
    `Create EXACTLY 3 new challenges for subject "${subject}" at level ${level} (${LEVEL_NAMES[level]}).`,
    `Level themes to draw from: ${levelTheme}`,
    `Allowed "type" values: "mcq", "multi", "order", "command", "spot". Vary the types.`,
    `Field rules:\n- id: "ai-${subject}-l${level}-<short-slug>"\n- xp: ${level === 1 ? 10 : level === 2 ? 20 : level === 3 ? 35 : 50}\n- estMinutes: 1-4\n- source: "ai"\n- command type: answerPatterns are REGEX SOURCES matched full-string against the normalized command; acceptExamples must match your own patterns\n- spot type: buggyLine is 1-indexed and must exist in snippet\n- mcq: 3-5 options; multi: 4-6 options with 2-3 correctIndices; order: 4-6 steps in CORRECT order`,
    `Avoid duplicating these existing challenge titles/topics:\n${existingTitles.map((t) => `- ${t}`).join('\n')}`,
    `One full example of the exact JSON shape for a single challenge:\n${schemaExample}`,
    `Output: a JSON array of 3 challenge objects. Nothing else.`,
  ].join('\n\n')
}
