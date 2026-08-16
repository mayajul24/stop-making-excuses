import type { Difficulty, PlayerState, Reaction, WeekRecord } from '../types'

/*
  Game rules. Every number in this file was signed off by Maya and should not
  drift: courage max 3, tier costs 1/1/2/3, XP 5/15/30/50, freeze caps at 4.
*/

export const COURAGE_MAX = 3
export const FREEZE_MAX = 4

export interface Tier {
  id: Difficulty
  rank: string
  /** English display headline — the thing that gets set big. */
  headline: string
  /** Imperative, for the main button: "NEXT STEP: SEND A MESSAGE". */
  action: string
  /** Past tense, for a completed node on the journey. */
  done: string
  /** Why it's worth doing — the quieter, reassuring voice. */
  why: string
  /** Step-by-step, shown once she's committed to the mission. */
  steps: string[]
  xp: number
  courage: number
  stars: 1 | 2 | 3
}

export const TIERS: Record<Difficulty, Tier> = {
  easy: {
    id: 'easy',
    rank: 'EASY',
    headline: 'OPEN THE APP',
    action: 'OPEN THE APP',
    done: 'OPENED THE APP',
    why: 'You don’t have to write anything. Open it, scroll, like one person. Week closed.',
    steps: [
      'Open the dating app',
      'Scroll for thirty seconds',
      'Like one person — don’t overthink it',
    ],
    xp: 5,
    courage: 1,
    stars: 1,
  },
  medium: {
    id: 'medium',
    rank: 'MEDIUM',
    headline: 'SEND A MESSAGE',
    action: 'SEND A MESSAGE',
    done: 'SENT A MESSAGE',
    why: 'You don’t need to find a husband. You need to talk to one human being.',
    steps: [
      'Pick one match',
      'Write something real — not “hey”',
      'Send it before you edit it a fifth time',
    ],
    xp: 15,
    courage: 1,
    stars: 2,
  },
  hard: {
    id: 'hard',
    rank: 'HARD',
    headline: 'ASK HIM OUT',
    action: 'ASK HIM OUT',
    done: 'ASKED HIM OUT',
    why: 'Worst case is “no”. And the worst thing that happens after a no is nothing.',
    steps: [
      'Check the conversation is actually flowing',
      'Suggest something concrete: place, day, time',
      'Send it',
    ],
    xp: 30,
    courage: 2,
    stars: 3,
  },
  nightmare: {
    id: 'nightmare',
    rank: 'NIGHTMARE',
    headline: 'GO ON A DATE',
    action: 'GO ON A DATE',
    done: 'WENT ON A DATE',
    why: 'Ninety minutes. Public place. You’re allowed to leave after.',
    steps: ['Pick a public place', 'Tell Maya when and where', 'Go'],
    xp: 50,
    courage: 3,
    stars: 3,
  },
}

export const TIER_ORDER: Difficulty[] = ['easy', 'medium', 'hard', 'nightmare']

/* --------------------------------------------------------------------
   Levels — one level per completed challenge, not per raw XP.
   -------------------------------------------------------------------- */

const LEVEL_TITLES: Record<number, string> = {
  1: 'Baby Steps 🐣',
  2: 'Getting Warmer 🌤️',
  3: 'Flirting Rookie 💅',
  4: 'Message Slinger 💬',
  5: 'Plot Twist Loading 🌀',
  6: 'Chaos Coordinator 🎭',
  7: 'Dating Menace 🔥',
  8: 'Serial First-Dater ☕',
  9: 'Unbothered Queen 👑',
  10: 'Main Character ✨',
}

export function levelInfo(completedCount: number) {
  const level = completedCount
  if (level <= 0) return { level, title: 'Not Started Yet', badge: '🥚' }
  if (level <= 10)
    return {
      level,
      title: LEVEL_TITLES[level],
      badge: level < 3 ? '🐣' : level < 6 ? '🌱' : level < 9 ? '🌸' : '✨',
    }
  return { level, title: `Certified Legend 🏆 ×${level - 9}`, badge: '🏆' }
}

/* --------------------------------------------------------------------
   Achievements — Maya's nine unlock conditions, set in the display voice.
   -------------------------------------------------------------------- */

export interface Achievement {
  id: string
  title: string
  blurb: string
  emoji: string
  earned: (h: WeekRecord[], s: PlayerState) => boolean
}

const hasDifficulty = (h: WeekRecord[], list: Difficulty[]) =>
  h.some((w) => w.difficulty !== null && list.includes(w.difficulty))

const hasReaction = (h: WeekRecord[], r: Reaction) =>
  h.some((w) => w.reaction === r)

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_message',
    title: 'SENT THE FIRST MESSAGE',
    blurb: 'You wrote first. That’s the hardest part and it’s behind you.',
    emoji: '🫡',
    earned: (h) => hasDifficulty(h, ['medium', 'hard', 'nightmare']),
  },
  {
    id: 'asked_out',
    title: 'ASKED HIM OUT',
    blurb: 'You asked. Out loud. Like an adult.',
    emoji: '🫣',
    earned: (h) => hasDifficulty(h, ['hard', 'nightmare']),
  },
  {
    id: 'bad_date',
    title: 'SURVIVED A BAD DATE',
    blurb: 'It was awful. You went home. Still standing.',
    emoji: '💀',
    earned: (h) => hasReaction(h, 'rough'),
  },
  {
    id: 'ghosted',
    title: 'REJECTED A GHOSTER',
    blurb: 'He vanished. You kept going. He lost.',
    emoji: '👻',
    earned: (h) => hasReaction(h, 'ghosted'),
  },
  {
    id: 'anyway',
    title: 'WENT ANYWAY',
    blurb: 'You were terrified and you went anyway.',
    emoji: '💅',
    earned: (h) => hasDifficulty(h, ['nightmare']),
  },
  {
    id: 'second_date',
    title: 'SECOND DATE UNLOCKED',
    blurb: 'Someone wants to see you again. Imagine that.',
    emoji: '❤️',
    earned: (h) => hasReaction(h, 'second_date'),
  },
  {
    id: 'streak4',
    title: '4-WEEK STREAK',
    blurb: 'Four weeks of showing up.',
    emoji: '🔥',
    earned: (_h, s) => s.streakLongest >= 4,
  },
  {
    id: 'coward',
    title: 'COWARD MODE GRADUATE',
    blurb: 'You dropped a level instead of disappearing. That counts.',
    emoji: '🐣',
    earned: (_h, s) => s.cowardUsed,
  },
  {
    id: 'streak8',
    title: '8-WEEK STREAK',
    blurb: 'Eight weeks. That’s not an accident anymore.',
    emoji: '👑',
    earned: (_h, s) => s.streakLongest >= 8,
  },
]

/* --------------------------------------------------------------------
   Derived values
   -------------------------------------------------------------------- */

export function completedCount(s: PlayerState): number {
  const past = s.history.filter((w) => w.status === 'done').length
  return past + (s.weekStatus === 'done' ? 1 : 0)
}

export function canAfford(s: PlayerState, d: Difficulty): boolean {
  return s.courage >= TIERS[d].courage
}

/** The hardest tier she can still pay for this week. */
export function bestAffordable(s: PlayerState): Difficulty | null {
  for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
    if (canAfford(s, TIER_ORDER[i])) return TIER_ORDER[i]
  }
  return null
}
