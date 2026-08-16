import type { PlayerState } from '../types'

/*
  The voice. English for the punchlines, Hebrew for anything that explains —
  that split is the house style and it stays.
*/

export type Mood = 'idle' | 'smug' | 'unimpressed' | 'proud'

export type Tone = 'calm' | 'urgent' | 'win'

export interface HomeVoice {
  /** English punchline in the banner. */
  bannerTitle: string
  /** Hebrew line under it. */
  bannerSub: string
  bannerTone: Tone
  /** What the dog says next to the active step. */
  dogLine: string
  dogMood: Mood
}

const DOG_IDLE = [
  'בואי נעשה משהו קטן 🐾',
  'זה הרגע שלך 🐾',
  'מוכנה? 🐾',
]

const DOG_NAGGING = [
  'אל תשברי את הרצף! 😈',
  'איפה נעלמת? 👀',
  'לא מוצאים בעל מהספה 😂',
]

const DOG_PROUD = ['גאה בך 🐾', 'תראי אותך!', 'איזה כיף!']

/** Deterministic pick so copy doesn't reshuffle on every re-render. */
function pick(list: string[], seed: number): string {
  return list[Math.abs(seed) % list.length]
}

export function homeVoice(state: PlayerState, daysLeft: number): HomeVoice {
  const seed = state.weekIndex

  if (state.weekStatus === 'done') {
    return {
      bannerTitle: 'HOLY SHIT YOU ACTUALLY DID IT',
      bannerSub: `${state.streakCurrent} שבועות ברצף. מאיה קיבלה עדכון 👀`,
      bannerTone: 'win',
      dogLine: pick(DOG_PROUD, seed),
      dogMood: 'proud',
    }
  }

  if (state.weekStatus === 'frozen') {
    return {
      bannerTitle: 'WEEK ON ICE ❄️',
      bannerSub: 'הרצף שלך נשמר. נתראה שבוע הבא.',
      bannerTone: 'calm',
      dogLine: 'שבוע רגוע ❄️',
      dogMood: 'idle',
    }
  }

  if (state.streakCurrent >= 1 && daysLeft <= 2) {
    return {
      bannerTitle: '🚨 Your dating streak is about to die.',
      bannerSub: `🔥 ${state.streakCurrent} שבועות ברצף · פג בעוד ${
        daysLeft === 1 ? 'יום' : `${daysLeft} ימים`
      }.`,
      bannerTone: 'urgent',
      dogLine: pick(DOG_NAGGING, seed),
      dogMood: 'unimpressed',
    }
  }

  const trailing = state.history.slice(-3)
  if (trailing.length === 3 && trailing.every((w) => w.status === 'missed')) {
    return {
      bannerTitle: 'You spent 3 weeks saying "maybe next week".',
      bannerSub: 'This is your villain origin story.',
      bannerTone: 'urgent',
      dogLine: 'בואי נשבור את הקללה 🐾',
      dogMood: 'unimpressed',
    }
  }

  return {
    bannerTitle:
      state.streakCurrent > 0
        ? `🔥 ${state.streakCurrent} weeks of showing up`
        : "Okay queen, we're not finding a husband from the couch 😂",
    bannerSub:
      state.streakCurrent > 0
        ? 'שבוע חדש, משימה אחת. בואי נמשיך.'
        : 'שבוע ראשון. אין מה להפסיד.',
    bannerTone: 'calm',
    dogLine: pick(DOG_IDLE, seed),
    dogMood: state.streakCurrent >= 4 ? 'smug' : 'idle',
  }
}
