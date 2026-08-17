export type Difficulty = 'easy' | 'medium' | 'hard' | 'nightmare'

export type WeekStatus = 'open' | 'done' | 'frozen' | 'missed'

export type Reaction =
  | 'great_date'
  | 'awkward'
  | 'rough'
  | 'ghosted'
  | 'second_date'

/** One resolved week in the journey. */
export interface WeekRecord {
  weekIndex: number
  status: Exclude<WeekStatus, 'open'>
  difficulty: Difficulty | null
  xp: number
  reaction: Reaction | null
}

/** A treat she can buy herself with coins. Doesn't touch XP or level. */
export interface SelfReward {
  id: string
  title: string
  cost: number
}

/** Something Maya owes her once lifetime XP clears the threshold. */
export interface MayaReward {
  id: string
  xpThreshold: number
  title: string
}

/** Everything the player owns. This is the shape a backend would return. */
export interface PlayerState {
  xp: number
  coins: number
  streakCurrent: number
  streakLongest: number
  weeksActive: number
  freezeTokens: number
  courage: number
  weekIndex: number
  weekStatus: WeekStatus
  weekDifficulty: Difficulty | null
  weekReaction: Reaction | null
  /** She flagged this week's action as scary for her, specifically — grants a Courage XP bonus once. */
  weekMarkedScary: boolean
  wentEasier: boolean
  history: WeekRecord[]
  reflections: { ts: number; text: string }[]
}
