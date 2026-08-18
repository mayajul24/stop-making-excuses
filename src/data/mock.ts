import type { MayaReward, PlayerState, SelfReward } from '../types'
import { FREEZE_MAX } from '../lib/game'

/*
  Mock data stands in for the backend. playerStore.tsx seeds its state from
  this snapshot for a brand-new player; dayIndex gets overwritten with the
  real current calendar day at seed time, not the placeholder below.
*/

export const mockInitialPlayer: PlayerState = {
  xp: 0,
  coins: 0,
  streakCurrent: 0,
  streakLongest: 0,
  daysActive: 0,
  freezeTokens: Math.min(2, FREEZE_MAX),
  dayIndex: 1,
  dayStatus: 'open',
  dayDifficulty: null,
  dayReaction: null,
  wentEasier: false,
  history: [],
  reflections: [],
}

// Coin costs were tuned for weekly XP accumulation; daily challenges earn
// XP (and coins, which always match XP) about 7x as fast, so these scale
// by the same factor Maya approved for the achievement/reward thresholds
// below — otherwise a coffee treat would be affordable within a couple of
// days instead of meaning anything.
export const mockSelfRewards: SelfReward[] = [
  { id: 'r1', title: 'A nice coffee or a treat', cost: 140 },
  { id: 'r2', title: 'A little something for me', cost: 280 },
  { id: 'r3', title: 'Movie night + snacks', cost: 490 },
]

// Same ~7x scaling, applied to the original 100/250/500 XP thresholds.
export const mockMayaRewards: MayaReward[] = [
  { id: 'm1', xpThreshold: 700, title: 'I owe you a coffee ☕' },
  { id: 'm2', xpThreshold: 1750, title: 'Wine night together 🍷' },
  { id: 'm3', xpThreshold: 3500, title: 'A little gift from me 🎁' },
]
