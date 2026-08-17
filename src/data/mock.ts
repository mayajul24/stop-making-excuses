import type { MayaReward, PlayerState, SelfReward } from '../types'
import { COURAGE_MAX, FREEZE_MAX } from '../lib/game'

/*
  Mock data stands in for the backend. playerStore.tsx seeds its state from
  this snapshot for a brand-new player; weekIndex gets overwritten with the
  real current calendar week at seed time, not the placeholder below.
*/

export const mockInitialPlayer: PlayerState = {
  xp: 0,
  coins: 0,
  streakCurrent: 0,
  streakLongest: 0,
  weeksActive: 0,
  freezeTokens: Math.min(2, FREEZE_MAX),
  courage: COURAGE_MAX,
  weekIndex: 1,
  weekStatus: 'open',
  weekDifficulty: null,
  weekReaction: null,
  cowardUsed: false,
  history: [],
  reflections: [],
}

export const mockSelfRewards: SelfReward[] = [
  { id: 'r1', title: 'A nice coffee or a treat', cost: 20 },
  { id: 'r2', title: 'A little something for me', cost: 40 },
  { id: 'r3', title: 'Movie night + snacks', cost: 70 },
]

export const mockMayaRewards: MayaReward[] = [
  { id: 'm1', xpThreshold: 100, title: 'I owe you a coffee ☕' },
  { id: 'm2', xpThreshold: 250, title: 'Wine night together 🍷' },
  { id: 'm3', xpThreshold: 500, title: 'A little gift from me 🎁' },
]
