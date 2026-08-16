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
  cowardUsed: boolean
  history: WeekRecord[]
  reflections: { ts: number; text: string }[]
}
