const MS_DAY = 24 * 60 * 60 * 1000

// A fixed date. Every day index counts forward from here so two devices
// computing "what day is it" from the same wall clock always agree.
const EPOCH = new Date('2024-01-01T00:00:00Z').getTime()

/** Which calendar day `now` falls on, counting from a fixed epoch. */
export function currentDayIndex(now: number = Date.now()): number {
  return Math.floor((now - EPOCH) / MS_DAY) + 1
}
