export type Difficulty = 'easy' | 'medium' | 'hard' | 'nightmare'

export type DayStatus = 'open' | 'done' | 'frozen' | 'missed'

export type Reaction =
  | 'great_date'
  | 'awkward'
  | 'rough'
  | 'ghosted'
  | 'second_date'

/** One resolved day in the journey. */
export interface DayRecord {
  dayIndex: number
  status: Exclude<DayStatus, 'open'>
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
  daysActive: number
  freezeTokens: number
  dayIndex: number
  dayStatus: DayStatus
  dayDifficulty: Difficulty | null
  dayReaction: Reaction | null
  wentEasier: boolean
  history: DayRecord[]
  reflections: { ts: number; text: string }[]
}
