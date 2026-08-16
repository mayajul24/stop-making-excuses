import type { MayaReward, PlayerState, SelfReward } from '../types'

/*
  Mock data stands in for the backend. playerStore.tsx seeds its state from
  this snapshot; swapping in a real backend means replacing that one seed
  with a fetch, not touching any screen.
*/

export const mockInitialPlayer: PlayerState = {
  xp: 240,
  coins: 95,
  streakCurrent: 6,
  streakLongest: 6,
  weeksActive: 6,
  freezeTokens: 2,
  courage: 2,
  weekIndex: 8,
  weekStatus: 'open',
  weekDifficulty: null,
  weekReaction: null,
  cowardUsed: true,
  history: [
    { weekIndex: 1, status: 'done', difficulty: 'easy', xp: 5, reaction: null },
    { weekIndex: 2, status: 'missed', difficulty: null, xp: 0, reaction: null },
    { weekIndex: 3, status: 'done', difficulty: 'medium', xp: 15, reaction: null },
    { weekIndex: 4, status: 'done', difficulty: 'medium', xp: 15, reaction: 'awkward' },
    { weekIndex: 5, status: 'frozen', difficulty: null, xp: 0, reaction: null },
    { weekIndex: 6, status: 'done', difficulty: 'hard', xp: 30, reaction: null },
    { weekIndex: 7, status: 'done', difficulty: 'nightmare', xp: 50, reaction: 'great_date' },
  ],
  reflections: [
    {
      ts: Date.now() - 6 * 864e5,
      text: 'He was shorter than his photos but honestly fine.',
    },
  ],
}

/** Days left in the current week — at 2 or fewer the voice starts nagging. */
export const mockDaysLeft = 5

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
