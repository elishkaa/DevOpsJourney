import { describe, expect, it } from 'vitest'
import { grade, normalizeCommand } from '../src/engine/grading'
import type { CommandChallenge, MultiChallenge, OrderChallenge, SpotChallenge } from '../src/types/challenge'
import { makeMcq } from './fixtures'

describe('mcq', () => {
  it('grades by index', () => {
    const c = makeMcq({ correctIndex: 1 })
    expect(grade(c, { type: 'mcq', index: 1 }).correct).toBe(true)
    expect(grade(c, { type: 'mcq', index: 0 }).correct).toBe(false)
  })
})

describe('multi', () => {
  const c: MultiChallenge = {
    ...makeMcq({}),
    type: 'multi',
    options: ['a', 'b', 'c', 'd'],
    correctIndices: [0, 2],
  } as unknown as MultiChallenge

  it('requires the exact set, order-insensitive', () => {
    expect(grade(c, { type: 'multi', indices: [2, 0] }).correct).toBe(true)
    expect(grade(c, { type: 'multi', indices: [0] }).correct).toBe(false)
    expect(grade(c, { type: 'multi', indices: [0, 2, 3] }).correct).toBe(false)
  })
})

describe('order', () => {
  const c: OrderChallenge = {
    ...makeMcq({}),
    type: 'order',
    steps: ['first', 'second', 'third'],
  } as unknown as OrderChallenge

  it('requires the exact sequence of original indices', () => {
    expect(grade(c, { type: 'order', sequence: [0, 1, 2] }).correct).toBe(true)
    expect(grade(c, { type: 'order', sequence: [1, 0, 2] }).correct).toBe(false)
    expect(grade(c, { type: 'order', sequence: [0, 1] }).correct).toBe(false)
  })
})

describe('command', () => {
  const c: CommandChallenge = {
    ...makeMcq({}),
    type: 'command',
    answerPatterns: ['kubectl logs [\\w-]+( -n \\w+)?', 'kubectl logs -n \\w+ [\\w-]+'],
    acceptExamples: ['kubectl logs payments-6f7b'],
  } as unknown as CommandChallenge

  it('normalizes whitespace and a leading $ prompt', () => {
    expect(normalizeCommand('  $   kubectl   logs x  ')).toBe('kubectl logs x')
  })

  it('matches any pattern, anchored full-string', () => {
    expect(grade(c, { type: 'command', text: '$ kubectl logs payments-6f7b' }).correct).toBe(true)
    expect(grade(c, { type: 'command', text: 'kubectl logs payments-6f7b -n prod' }).correct).toBe(true)
    expect(grade(c, { type: 'command', text: 'kubectl logs' }).correct).toBe(false)
    expect(grade(c, { type: 'command', text: 'sudo kubectl logs payments-6f7b' }).correct).toBe(false)
  })

  it('rejects empty input', () => {
    expect(grade(c, { type: 'command', text: '   ' }).correct).toBe(false)
  })

  it('is case-sensitive (flags matter)', () => {
    expect(grade(c, { type: 'command', text: 'KUBECTL LOGS payments-6f7b' }).correct).toBe(false)
  })
})

describe('spot', () => {
  const c: SpotChallenge = {
    ...makeMcq({}),
    type: 'spot',
    snippet: 'line1\nline2\nline3\nline4',
    snippetLang: 'yaml',
    buggyLine: 3,
    acceptableLines: [4],
  } as unknown as SpotChallenge

  it('accepts the buggy line and tolerated alternates', () => {
    expect(grade(c, { type: 'spot', line: 3 }).correct).toBe(true)
    expect(grade(c, { type: 'spot', line: 4 }).correct).toBe(true)
    expect(grade(c, { type: 'spot', line: 1 }).correct).toBe(false)
  })
})

describe('free', () => {
  it('maps AI score to correctness at 0.7', () => {
    const c = { ...makeMcq({}), type: 'free', rubric: 'r'.repeat(12), modelAnswer: 'm'.repeat(12) }
    expect(grade(c as never, { type: 'free', text: 'x', aiScore: 0.8 }).correct).toBe(true)
    expect(grade(c as never, { type: 'free', text: 'x', aiScore: 0.5 }).correct).toBe(false)
    expect(grade(c as never, { type: 'free', text: 'x' }).correct).toBe(false)
  })
})

describe('type mismatch', () => {
  it('never crashes on a mismatched answer payload', () => {
    const c = makeMcq({})
    expect(grade(c, { type: 'command', text: 'ls' }).correct).toBe(false)
  })
})
