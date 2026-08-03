import confetti from 'canvas-confetti'
import { useSettingsStore } from '../store/settingsStore'

export type BurstKind = 'small' | 'big' | 'fireworks'

function reducedMotion(): boolean {
  const s = useSettingsStore.getState().settings
  return s.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const BRAND_COLORS = ['#2dd4bf', '#38bdf8', '#f5b93c', '#a78bfa', '#34d399']

export function burst(kind: BurstKind): void {
  if (reducedMotion()) return
  if (kind === 'small') {
    confetti({ particleCount: 60, spread: 55, startVelocity: 28, origin: { y: 0.75 }, colors: BRAND_COLORS })
    return
  }
  if (kind === 'big') {
    confetti({ particleCount: 160, spread: 100, startVelocity: 38, origin: { y: 0.7 }, colors: BRAND_COLORS })
    return
  }
  // fireworks: three timed volleys from the sides
  const shot = (x: number, angle: number) =>
    confetti({ particleCount: 90, angle, spread: 60, startVelocity: 45, origin: { x, y: 0.8 }, colors: BRAND_COLORS })
  shot(0.1, 60)
  setTimeout(() => shot(0.9, 120), 180)
  setTimeout(() => shot(0.5, 90), 360)
}
