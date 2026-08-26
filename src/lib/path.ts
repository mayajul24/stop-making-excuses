import type { PlayerState } from '../types'
import { TIERS, tierVariant } from './game'

export type NodeKind =
  | 'done'
  | 'milestone'
  | 'frozen'
  | 'missed'
  | 'current'
  | 'future'

export interface PathNode {
  key: string
  kind: NodeKind
  label: string
  stars: number
  dayIndex: number
  /**
   * The node for the day she is standing in right now, whether it's still
   * open, already done, or frozen. The mascot parks here — including
   * straight after she completes something, which is when she most wants
   * company.
   */
  isLive?: boolean
}

// Daily challenges accumulate history much faster than weekly ones did —
// a year of daily play is ~365 nodes instead of ~52. Nobody needs to
// scroll through all of it, so only the most recent stretch renders.
const VISIBLE_HISTORY = 29

/**
 * Turns the player's history into the winding journey. Every fifth completed
 * challenge becomes a gold milestone, so the reward pacing stays tied to what
 * she actually did rather than to how many days went by. Milestone counting
 * runs over her *entire* history so the gold nodes land in the right place
 * even though only the recent tail actually gets rendered.
 */
// A long dimmed tail of upcoming circles, not just a single "tomorrow"
// placeholder — the endless-looking path she pointed at in Duolingo's own
// reference screenshots.
export function buildPath(state: PlayerState, futureCount = 40): PathNode[] {
  const nodes: PathNode[] = []
  let doneSoFar = 0
  const visible = state.history.slice(-VISIBLE_HISTORY)
  const hiddenCount = state.history.length - visible.length

  for (let i = 0; i < hiddenCount; i++) {
    if (state.history[i].status === 'done') doneSoFar++
  }

  for (const day of visible) {
    if (day.status === 'done') {
      doneSoFar++
      const tier = day.difficulty ? TIERS[day.difficulty] : null
      nodes.push({
        key: `d${day.dayIndex}`,
        kind: doneSoFar % 5 === 0 ? 'milestone' : 'done',
        // Re-derived from the day's own index, not looked up from anywhere
        // stored — same deterministic pick tierVariant() would've made
        // that day, so a past node always shows what it actually showed.
        label: tier ? tierVariant(tier, day.dayIndex).done : 'DONE',
        stars: tier ? tier.stars : 0,
        dayIndex: day.dayIndex,
      })
    } else if (day.status === 'frozen') {
      nodes.push({
        key: `d${day.dayIndex}`,
        kind: 'frozen',
        label: 'ON ICE',
        stars: 0,
        dayIndex: day.dayIndex,
      })
    } else {
      nodes.push({
        key: `d${day.dayIndex}`,
        kind: 'missed',
        label: 'SKIPPED',
        stars: 0,
        dayIndex: day.dayIndex,
      })
    }
  }

  // The day she's standing in right now.
  if (state.dayStatus === 'done') {
    doneSoFar++
    const tier = state.dayDifficulty ? TIERS[state.dayDifficulty] : null
    nodes.push({
      key: `d${state.dayIndex}`,
      kind: doneSoFar % 5 === 0 ? 'milestone' : 'done',
      label: tier ? tierVariant(tier, state.dayIndex).done : 'DONE',
      stars: tier ? tier.stars : 0,
      dayIndex: state.dayIndex,
      isLive: true,
    })
  } else if (state.dayStatus === 'frozen') {
    nodes.push({
      key: `d${state.dayIndex}`,
      kind: 'frozen',
      label: 'ON ICE',
      stars: 0,
      dayIndex: state.dayIndex,
      isLive: true,
    })
  } else {
    nodes.push({
      key: `d${state.dayIndex}`,
      kind: 'current',
      label: 'YOU ARE HERE',
      stars: 0,
      dayIndex: state.dayIndex,
      isLive: true,
    })
  }

  for (let i = 1; i <= futureCount; i++) {
    nodes.push({
      key: `f${state.dayIndex + i}`,
      kind: 'future',
      // Only the very next one says "TOMORROW" — repeating that label
      // down 40 dimmed circles would just be noise.
      label: i === 1 ? 'TOMORROW' : '',
      stars: 0,
      dayIndex: state.dayIndex + i,
    })
  }

  return nodes
}
