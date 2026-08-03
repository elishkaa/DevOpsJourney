export type SubjectId =
  | 'linux'
  | 'git'
  | 'networking'
  | 'docker'
  | 'kubernetes'
  | 'cicd'
  | 'iac'
  | 'cloud'
  | 'observability'
  | 'security'

export type ChallengeLevel = 1 | 2 | 3 | 4
export type InteractionType = 'mcq' | 'multi' | 'order' | 'command' | 'spot' | 'free'
export type ArtifactLang = 'bash' | 'yaml' | 'dockerfile' | 'hcl' | 'json' | 'ini' | 'text'

interface ChallengeBase {
  /** `${subject}-l${level}-${slug}` for seed content; `ai-…` for generated */
  id: string
  subject: SubjectId
  level: ChallengeLevel
  /** Ticket-style: "INC-2041: payments pod is CrashLoopBackOff" */
  title: string
  /** Narrative context — on-call situation, alert text, ticket body (MiniMarkdown) */
  scenario: string
  /** Optional log/config/code block rendered under the scenario */
  artifact?: string
  artifactLang?: ArtifactLang
  /** The actual question */
  prompt: string
  /** Teaches the FUNDAMENTAL behind the fix, not just the answer (MiniMarkdown) */
  explanation: string
  /** Short concept key from the subject's controlled vocabulary; SRS groups by it */
  fundamental: string
  /** Base XP; convention 10/20/35/50 by level */
  xp: number
  tags: string[]
  estMinutes: number
  source: 'seed' | 'ai'
}

export interface McqChallenge extends ChallengeBase {
  type: 'mcq'
  options: string[]
  correctIndex: number
}

export interface MultiChallenge extends ChallengeBase {
  type: 'multi'
  options: string[]
  /** Order-insensitive exact set */
  correctIndices: number[]
}

export interface OrderChallenge extends ChallengeBase {
  type: 'order'
  /** Stored in correct order; shuffled deterministically at render */
  steps: string[]
}

export interface CommandChallenge extends ChallengeBase {
  type: 'command'
  /** Regex sources, matched full-string after normalization */
  answerPatterns: string[]
  /** Canonical accepted answers (shown after solving; must self-match patterns) */
  acceptExamples: string[]
  placeholder?: string
  hint?: string
}

export interface SpotChallenge extends ChallengeBase {
  type: 'spot'
  snippet: string
  snippetLang: ArtifactLang
  /** 1-indexed */
  buggyLine: number
  acceptableLines?: number[]
}

export interface FreeChallenge extends ChallengeBase {
  type: 'free'
  /** Grading rubric handed to the AI mentor */
  rubric: string
  modelAnswer: string
}

export type Challenge =
  | McqChallenge
  | MultiChallenge
  | OrderChallenge
  | CommandChallenge
  | SpotChallenge
  | FreeChallenge

export type DeterministicChallenge = Exclude<Challenge, FreeChallenge>

export const LEVEL_NAMES: Record<ChallengeLevel, string> = {
  1: 'Rookie',
  2: 'Operator',
  3: 'Engineer',
  4: 'Architect',
}

export const BASE_XP: Record<ChallengeLevel, number> = { 1: 10, 2: 20, 3: 35, 4: 50 }
