import type { PlayerState } from '../types'

/*
  The voice: her blunt best friend, not her coach. Warm, funny, a little
  teasing — never guilt-tripping, never a motivational poster. The goal is
  "okay, maybe I actually can do this," never "ugh, I failed." A missed week
  gets a nudge, not a scolding — nothing here should read as disappointed.
*/

export type Mood = 'idle' | 'smug' | 'unimpressed' | 'proud'

export type Tone = 'calm' | 'urgent' | 'win'

export interface HomeVoice {
  bannerTitle: string
  bannerSub: string
  bannerTone: Tone
  /** What Maya says next to the live step. */
  mascotLine: string
  mascotMood: Mood
}

const IDLE_LINES = [
  'Ready? ✨',
  'One small thing. That’s it.',
  'This is your moment.',
]

const NUDGE_LINES = [
  'Still here when you’re ready 👀',
  'No rush. I’ll wait.',
  'Whenever you feel like it, not before.',
]

const PROUD_LINES = ['Proud of you 🥹', 'Look at you!', 'See? Not so bad.']

/** Deterministic pick so copy doesn't reshuffle on every re-render. */
function pick(list: string[], seed: number): string {
  return list[Math.abs(seed) % list.length]
}

export function homeVoice(state: PlayerState, daysLeft: number): HomeVoice {
  const seed = state.weekIndex

  if (state.weekStatus === 'done') {
    return {
      bannerTitle: 'HOLY SHIT YOU ACTUALLY DID IT',
      bannerSub: `${state.streakCurrent} weeks in a row. Maya has been notified 👀`,
      bannerTone: 'win',
      mascotLine: pick(PROUD_LINES, seed),
      mascotMood: 'proud',
    }
  }

  if (state.weekStatus === 'frozen') {
    return {
      bannerTitle: 'WEEK ON ICE ❄️',
      bannerSub: 'Your streak is safe. See you next week.',
      bannerTone: 'calm',
      mascotLine: 'Resting is allowed ❄️',
      mascotMood: 'idle',
    }
  }

  if (state.streakCurrent >= 1 && daysLeft <= 2) {
    return {
      bannerTitle: 'Your streak misses you 👀',
      bannerSub: `🔥 ${state.streakCurrent} weeks in a row · ${
        daysLeft === 1 ? '1 day' : `${daysLeft} days`
      } left, if you feel like it.`,
      bannerTone: 'urgent',
      mascotLine: pick(NUDGE_LINES, seed),
      mascotMood: 'unimpressed',
    }
  }

  const trailing = state.history.slice(-3)
  if (trailing.length === 3 && trailing.every((w) => w.status === 'missed')) {
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
        ? `🔥 ${state.streakCurrent} weeks of showing up`
        : 'Okay queen, we’re not finding a husband from the couch 😂',
    bannerSub:
      state.streakCurrent > 0
        ? 'New week, one small thing. Whatever size feels okay.'
        : 'Week one. Nothing to lose.',
    bannerTone: 'calm',
    mascotLine: pick(IDLE_LINES, seed),
    mascotMood: state.streakCurrent >= 4 ? 'smug' : 'idle',
  }
}
