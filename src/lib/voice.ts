import type { PlayerState } from '../types'

/*
  The voice: her blunt best friend, not her coach. Warm, funny, a little
  teasing — never guilt-tripping, never a motivational poster. The goal is
  "okay, maybe I actually can do this," never "ugh, I failed." A missed day
  gets a nudge, not a scolding — nothing here should read as disappointed.
*/

export type Mood = 'idle' | 'smug' | 'unimpressed' | 'proud'

export type Tone = 'calm' | 'urgent' | 'win'

export interface HomeVoice {
  bannerTitle: string
  bannerSub: string
  bannerTone: Tone
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
    return {
      bannerTitle: 'HOLY SHIT YOU ACTUALLY DID IT',
      bannerSub: `${state.streakCurrent} days in a row. Maya has been notified 👀`,
      bannerTone: 'win',
      mascotLine: pick(PROUD_LINES, seed),
      mascotMood: 'proud',
    }
  }

  if (state.dayStatus === 'frozen') {
    return {
      bannerTitle: 'TODAY’S ON ICE ❄️',
      bannerSub: 'Your streak is safe. See you tomorrow.',
      bannerTone: 'calm',
      mascotLine: 'Resting is allowed ❄️',
      mascotMood: 'idle',
    }
  }

  // 21 missed days is the same real-world dry spell the old weekly version
  // called out at 3 missed weeks — scaled by the same ~7x the atomic unit
  // shrank by, not just relabeled.
  const trailing = state.history.slice(-21)
  if (trailing.length === 21 && trailing.every((d) => d.status === 'missed')) {
    return {
      bannerTitle: 'Been a minute since you showed up.',
      bannerSub: 'No pressure — one small thing, whenever you’re ready.',
      bannerTone: 'calm',
      mascotLine: 'Still here 👀',
      mascotMood: 'idle',
    }
  }

  return {
    bannerTitle:
      state.streakCurrent > 0
        ? `🔥 ${state.streakCurrent} days of showing up`
        : 'Okay queen, we’re not finding a husband from the couch 😂',
    bannerSub:
      state.streakCurrent > 0
        ? 'New day, one small thing. Whatever size feels okay.'
        : 'Day one. Nothing to lose.',
    bannerTone: 'calm',
    mascotLine: pick(IDLE_LINES, seed),
    mascotMood: state.streakCurrent >= 4 ? 'smug' : 'idle',
  }
}
