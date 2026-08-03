import { describe, expect, it } from 'vitest'
import { answerPlacement, nextPlacementQuestion, startPlacement } from '../src/engine/placement'
import { makePool } from './fixtures'

const pool = makePool('docker')

function runPlacement(answers: boolean[]): number {
  let state = startPlacement('docker')
  for (const correct of answers) {
    const q = nextPlacementQuestion(state, pool)
    expect(q).not.toBeNull()
    state = answerPlacement(state, q!, correct)
  }
  expect(state.done).toBe(true)
  return state.rating
}

describe('placement', () => {
  it('5/5 correct places high (≥700)', () => {
    expect(runPlacement([true, true, true, true, true])).toBeGreaterThanOrEqual(700)
  })

  it('0/5 places low (≤150)', () => {
    expect(runPlacement([false, false, false, false, false])).toBeLessThanOrEqual(150)
  })

  it('alternating answers land mid-range (250–550)', () => {
    const r = runPlacement([true, false, true, false, true])
    expect(r).toBeGreaterThanOrEqual(250)
    expect(r).toBeLessThanOrEqual(550)
  })

  it('monotonic: an extra correct never lowers the final rating', () => {
    const patterns: boolean[][] = []
    for (let mask = 0; mask < 32; mask++) {
      patterns.push([0, 1, 2, 3, 4].map((b) => Boolean(mask & (1 << b))))
    }
    for (const p of patterns) {
      for (let i = 0; i < 5; i++) {
        if (!p[i]) {
          const better = p.slice()
          better[i] = true
          expect(runPlacement(better)).toBeGreaterThanOrEqual(runPlacement(p))
        }
      }
    }
  })

  it('serves harder questions after correct answers', () => {
    let state = startPlacement('docker')
    const first = nextPlacementQuestion(state, pool)!
    state = answerPlacement(state, first, true)
    const second = nextPlacementQuestion(state, pool)!
    expect(second.level).toBeGreaterThanOrEqual(first.level)
  })

  it('never repeats a question', () => {
    let state = startPlacement('docker')
    const seen = new Set<string>()
    for (let i = 0; i < 5; i++) {
      const q = nextPlacementQuestion(state, pool)!
      expect(seen.has(q.id)).toBe(false)
      seen.add(q.id)
      state = answerPlacement(state, q, i % 2 === 0)
    }
  })
})
