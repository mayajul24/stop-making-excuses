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
  /** What the dog says next to the live step. */
  dogLine: string
  dogMood: Mood
}

const DOG_IDLE = [
  'Ready? 🐾',
  'One small thing. That’s it 🐾',
  'This is your moment 🐾',
]

const DOG_NAGGING = [
  'Don’t break the streak 😈',
  'Where did you go? 👀',
  'Not from the couch, queen 😂',
]

const DOG_PROUD = ['Proud of you 🐾', 'Look at you!', 'See? Not so bad.']

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
      dogLine: pick(DOG_PROUD, seed),
      dogMood: 'proud',
    }
  }

  if (state.weekStatus === 'frozen') {
    return {
      bannerTitle: 'WEEK ON ICE ❄️',
      bannerSub: 'Your streak is safe. See you next week.',
      bannerTone: 'calm',
      dogLine: 'Resting is allowed ❄️',
      dogMood: 'idle',
    }
  }

  if (state.streakCurrent >= 1 && daysLeft <= 2) {
    return {
      bannerTitle: '🚨 Your dating streak is about to die.',
      bannerSub: `🔥 ${state.streakCurrent} weeks in a row · ${
        daysLeft === 1 ? '1 day' : `${daysLeft} days`
      } left.`,
      bannerTone: 'urgent',
      dogLine: pick(DOG_NAGGING, seed),
      dogMood: 'unimpressed',
    }
  }

  const trailing = state.history.slice(-3)
  if (trailing.length === 3 && trailing.every((w) => w.status === 'missed')) {
    return {
      bannerTitle: 'You spent 3 weeks saying “maybe next week”.',
      bannerSub: 'This is your villain origin story.',
      bannerTone: 'urgent',
      dogLine: 'Let’s break the curse 🐾',
      dogMood: 'unimpressed',
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
    dogLine: pick(DOG_IDLE, seed),
    dogMood: state.streakCurrent >= 4 ? 'smug' : 'idle',
  }
}
