const MS_DAY = 24 * 60 * 60 * 1000
const MS_WEEK = 7 * MS_DAY

// A fixed Monday. Every week index counts forward from here so two devices
// computing "what week is it" from the same wall clock always agree.
const EPOCH = new Date('2024-01-01T00:00:00Z').getTime()

/** Which calendar week `now` falls in, counting from a fixed Monday epoch. */
export function currentWeekIndex(now: number = Date.now()): number {
  return Math.floor((now - EPOCH) / MS_WEEK) + 1
}

/** Days remaining before the current calendar week rolls over. */
export function daysLeftInWeek(now: number = Date.now()): number {
  const intoWeek = (now - EPOCH) % MS_WEEK
  return Math.max(1, Math.ceil((MS_WEEK - intoWeek) / MS_DAY))
}

/** How many days old the current calendar week is — 0 on the day it opened. */
export function daysIntoWeek(now: number = Date.now()): number {
  const intoWeek = (now - EPOCH) % MS_WEEK
  return Math.floor(intoWeek / MS_DAY)
}
