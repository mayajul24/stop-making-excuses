import type { PlayerState } from '../types'
import { TIERS } from './game'

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
  weekIndex: number
}

/**
 * Turns the player's history into the winding journey. Every fifth completed
 * challenge becomes a gold milestone, so the reward pacing stays tied to what
 * she actually did rather than to how many weeks went by.
 */
export function buildPath(state: PlayerState, futureCount = 2): PathNode[] {
  const nodes: PathNode[] = []
  let doneSoFar = 0

  for (const week of state.history) {
    if (week.status === 'done') {
      doneSoFar++
      const tier = week.difficulty ? TIERS[week.difficulty] : null
      nodes.push({
        key: `w${week.weekIndex}`,
        kind: doneSoFar % 5 === 0 ? 'milestone' : 'done',
        label: tier ? tier.done : 'DONE',
        stars: tier ? tier.stars : 0,
        weekIndex: week.weekIndex,
      })
    } else if (week.status === 'frozen') {
      nodes.push({
        key: `w${week.weekIndex}`,
        kind: 'frozen',
        label: 'ON ICE',
        stars: 0,
        weekIndex: week.weekIndex,
      })
    } else {
      nodes.push({
        key: `w${week.weekIndex}`,
        kind: 'missed',
        label: 'SKIPPED',
        stars: 0,
        weekIndex: week.weekIndex,
      })
    }
  }

  // The week she's standing in right now.
  if (state.weekStatus === 'done') {
    doneSoFar++
    const tier = state.weekDifficulty ? TIERS[state.weekDifficulty] : null
    nodes.push({
      key: `w${state.weekIndex}`,
      kind: doneSoFar % 5 === 0 ? 'milestone' : 'done',
      label: tier ? tier.done : 'DONE',
      stars: tier ? tier.stars : 0,
      weekIndex: state.weekIndex,
    })
  } else if (state.weekStatus === 'frozen') {
    nodes.push({
      key: `w${state.weekIndex}`,
      kind: 'frozen',
      label: 'ON ICE',
      stars: 0,
      weekIndex: state.weekIndex,
    })
  } else {
    nodes.push({
      key: `w${state.weekIndex}`,
      kind: 'current',
      label: 'YOU ARE HERE',
      stars: 0,
      weekIndex: state.weekIndex,
    })
  }

  for (let i = 1; i <= futureCount; i++) {
    nodes.push({
      key: `f${state.weekIndex + i}`,
      kind: 'future',
      label: `WEEK ${state.weekIndex + i}`,
      stars: 0,
      weekIndex: state.weekIndex + i,
    })
  }

  return nodes
}
