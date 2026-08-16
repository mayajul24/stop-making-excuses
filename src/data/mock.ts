import type { PlayerState } from '../types'

/*
  Mock data stands in for the backend. Everything the UI reads comes through
  here, so swapping in Supabase later means replacing this module's export
  with a fetch — no component changes.
*/

export const mockPlayer: PlayerState = {
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
