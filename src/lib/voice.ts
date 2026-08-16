import type { PlayerState } from '../types'

/*
  The voice: her blunt best friend. Warm, funny, never motivational-poster.
  Celebrates showing up, never romantic outcomes.
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

const NAGGING_LINES = [
  'Don’t break the streak 😈',
  'Where did you go? 👀',
  'Not from the couch, queen 😂',
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
      bannerTitle: '🚨 Your dating streak is about to die.',
      bannerSub: `🔥 ${state.streakCurrent} weeks in a row · ${
        daysLeft === 1 ? '1 day' : `${daysLeft} days`
      } left.`,
      bannerTone: 'urgent',
      mascotLine: pick(NAGGING_LINES, seed),
      mascotMood: 'unimpressed',
    }
  }

  const trailing = state.history.slice(-3)
  if (trailing.length === 3 && trailing.every((w) => w.status === 'missed')) {
    return {
      bannerTitle: 'You spent 3 weeks saying “maybe next week”.',
      bannerSub: 'This is your villain origin story.',
      bannerTone: 'urgent',
      mascotLine: 'Let’s break the curse ✨',
      mascotMood: 'unimpressed',
    }
  }

  return {
    bannerTitle:
      state.streakCurrent > 0
        ? `🔥 ${state.streakCurrent} weeks of showing up`
        : 'Okay queen, we’re not finding a husband from the couch 😂',
    bannerSub:
      state.streakCurrent > 0
        ? 'New week, one mission. Let’s keep going.'
        : 'Week one. Nothing to lose.',
    bannerTone: 'calm',
    mascotLine: pick(IDLE_LINES, seed),
    mascotMood: state.streakCurrent >= 4 ? 'smug' : 'idle',
  }
}
