// xmur3 is from bryc's public-domain "PRNGs in JavaScript": https://github.com/bryc/code/blob/master/jshash/PRNGs.md
/** xmur3 string hash → 32-bit seed */
export function xmur3(str: string): number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^= h >>> 16) >>> 0
}

// mulberry32 is by Tommy Ettinger (public domain): https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
/** mulberry32 PRNG from a 32-bit seed */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Deterministic Fisher–Yates shuffle (returns a new array) */
export function seededShuffle<T>(items: readonly T[], seedStr: string): T[] {
  const rand = mulberry32(xmur3(seedStr))
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Deterministic pick of one item */
export function seededPick<T>(items: readonly T[], seedStr: string): T {
  return items[xmur3(seedStr) % items.length]
}
