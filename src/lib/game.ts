import type { Difficulty, PlayerState, Reaction, WeekRecord } from '../types'

/*
  Game rules. Courage max 3, tier costs 1/1/2/3, freeze caps at 4 — those
  stay fixed. XP (now "Courage XP", rewarding how much a step pushed her,
  not the romantic outcome) runs 5/25/50/75 per the difficulty-ladder spec.
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
    rank: '🐣 BARELY BRAVE',
    headline: 'OPEN THE APP',
    action: 'OPEN THE APP',
    done: 'OPENED THE APP',
    why: 'You don’t have to write anything. Open it, scroll, like one person you actually think is cute. Week closed.',
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
    rank: '😬 A LITTLE ANXIOUS',
    headline: 'SEND A MESSAGE',
    action: 'SEND A MESSAGE',
    done: 'SENT A MESSAGE',
    why: 'You don’t need to find a husband. You need to reply to one human being.',
    steps: [
      'Pick one match',
      'Write something real — not “hey”',
      'Send it before you edit it a fifth time',
    ],
    xp: 25,
    courage: 1,
    stars: 2,
  },
  hard: {
    id: 'hard',
    rank: '😳 OKAY WE’RE DOING THIS',
    headline: 'SUGGEST COFFEE',
    action: 'SUGGEST COFFEE',
    done: 'SUGGESTED COFFEE',
    why: 'Not a Big Declaration. Just "want to grab a coffee sometime?" Worst case is "no", and the worst thing after a no is nothing.',
    steps: [
      'Check the conversation is actually flowing',
      'Keep it low-key: coffee, not dinner',
      'Send it',
    ],
    xp: 50,
    courage: 2,
    stars: 3,
  },
  nightmare: {
    id: 'nightmare',
    rank: '💀 MAIN CHARACTER',
    headline: 'GO ON A DATE',
    action: 'GO ON A DATE',
    done: 'WENT ON A DATE',
    why: 'Ninety minutes. Public place. You’re allowed to leave after.',
    steps: ['Pick a public place', 'Tell Maya when and where', 'Go'],
    xp: 75,
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

const countDifficulty = (h: WeekRecord[], list: Difficulty[]) =>
  h.filter((w) => w.difficulty !== null && list.includes(w.difficulty)).length

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
    id: 'three_times_brave',
    title: 'THREE TIMES BRAVE',
    blurb: 'Hard is only hard the first few times.',
    emoji: '🫣',
    earned: (h) => countDifficulty(h, ['hard', 'nightmare']) >= 3,
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
    blurb: 'They vanished. You kept going. They lost.',
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
    id: 'played_smart',
    title: 'PLAYED IT SMART',
    blurb: 'You picked the easier path instead of disappearing. That’s not quitting — that’s strategy.',
    emoji: '🧠',
    earned: (_h, s) => s.wentEasier,
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

/** History plus the week in progress, if it has resolved to done or frozen. */
export function fullHistory(s: PlayerState): WeekRecord[] {
  if (s.weekStatus !== 'done' && s.weekStatus !== 'frozen') return s.history
  return [
    ...s.history,
    {
      weekIndex: s.weekIndex,
      status: s.weekStatus,
      difficulty: s.weekDifficulty,
      xp: s.weekDifficulty ? TIERS[s.weekDifficulty].xp : 0,
      reaction: s.weekReaction,
    },
  ]
}

export function completedCount(s: PlayerState): number {
  const past = s.history.filter((w) => w.status === 'done').length
  return past + (s.weekStatus === 'done' ? 1 : 0)
}

export function canAfford(s: PlayerState, d: Difficulty): boolean {
  return s.courage >= TIERS[d].courage
}

/**
 * The gentlest tier she can still pay for this week — the default offer.
 * Escalating to something harder is something she opts into via ⇄, not the
 * thing she's handed by default. (At full courage, Nightmare is technically
 * affordable on its own cost — defaulting to "go on a date" as week one's
 * suggestion would undercut the whole point of the courage gate.)
 */
export function easiestAffordable(s: PlayerState): Difficulty | null {
  for (const d of TIER_ORDER) {
    if (canAfford(s, d)) return d
  }
  return null
}
