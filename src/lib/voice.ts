import type { PlayerState } from '../types'

/*
  The voice: her blunt best friend, not her coach. Warm, funny, a little
  teasing — never guilt-tripping, never a motivational poster. The goal is
  "okay, maybe I actually can do this," never "ugh, I failed." A missed day
  gets a nudge, not a scolding — nothing here should read as disappointed.

  Only the mascot's own speech bubble on the path carries this anymore —
  there used to also be a banner box at the top of Home with a matching
  title/subtitle, removed because it read as redundant clutter sitting
  right above the same character saying a similar thing.
*/

export type Mood = 'idle' | 'smug' | 'unimpressed' | 'proud'

export interface HomeVoice {
  mascotLine: string
  mascotMood: Mood
}

const IDLE_LINES = [
  'Ready? ✨',
  'One small thing. That’s it.',
  'This is your moment.',
]

const PROUD_LINES = ['Proud of you 🥹', 'Look at you!', 'See? Not so bad.']

/** Deterministic pick so copy doesn't reshuffle on every re-render. */
function pick(list: string[], seed: number): string {
  return list[Math.abs(seed) % list.length]
}

export function homeVoice(state: PlayerState): HomeVoice {
  const seed = state.dayIndex

  if (state.dayStatus === 'done') {
    return { mascotLine: pick(PROUD_LINES, seed), mascotMood: 'proud' }
  }

  if (state.dayStatus === 'frozen') {
    return { mascotLine: 'Resting is allowed ❄️', mascotMood: 'idle' }
  }

  // 21 missed days is the same real-world dry spell the old weekly version
  // called out at 3 missed weeks — scaled by the same ~7x the atomic unit
  // shrank by, not just relabeled.
  const trailing = state.history.slice(-21)
  if (trailing.length === 21 && trailing.every((d) => d.status === 'missed')) {
    return { mascotLine: 'Still here 👀', mascotMood: 'idle' }
  }

  return {
    mascotLine: pick(IDLE_LINES, seed),
    mascotMood: state.streakCurrent >= 4 ? 'smug' : 'idle',
  }
}
