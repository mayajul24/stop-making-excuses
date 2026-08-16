import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Difficulty, PlayerState, Reaction } from '../types'
import { COURAGE_MAX, FREEZE_MAX, TIERS } from '../lib/game'
import { mockInitialPlayer } from '../data/mock'

/*
  Every mutation the app can make to a PlayerState, in one place. This is
  local React state today; the point of keeping every write behind these
  functions rather than scattered setState calls is that swapping in a real
  backend later means rewriting this file's insides, not every screen that
  touches the player.
*/
interface PlayerActions {
  markDone: (difficulty: Difficulty) => void
  freezeWeek: () => void
  useCowardMode: () => void
  refillCourage: () => void
  setReaction: (r: Reaction) => void
  addReflection: (text: string) => void
  spendCoins: (amount: number) => boolean
  rollToNextWeek: () => void
  resetAll: () => void
}

const PlayerContext = createContext<
  { player: PlayerState } & PlayerActions
>(null as never)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<PlayerState>(mockInitialPlayer)

  const markDone = useCallback((difficulty: Difficulty) => {
    setPlayer((s) => {
      if (s.weekStatus !== 'open') return s
      const tier = TIERS[difficulty]
      if (s.courage < tier.courage) return s
      const streakCurrent = s.streakCurrent + 1
      return {
        ...s,
        xp: s.xp + tier.xp,
        coins: s.coins + tier.xp,
        courage: s.courage - tier.courage,
        weekStatus: 'done',
        weekDifficulty: difficulty,
        weekReaction: null,
        streakCurrent,
        streakLongest: Math.max(s.streakLongest, streakCurrent),
        weeksActive: s.weeksActive + 1,
      }
    })
  }, [])

  const freezeWeek = useCallback(() => {
    setPlayer((s) => {
      if (s.weekStatus !== 'open' || s.freezeTokens <= 0) return s
      return { ...s, weekStatus: 'frozen', freezeTokens: s.freezeTokens - 1 }
    })
  }, [])

  // Never fails, never marks the week done — it just quietly makes Medium
  // the standing offer so there's always a smaller door out.
  const useCowardMode = useCallback(() => {
    setPlayer((s) => (s.weekStatus === 'open' ? { ...s, cowardUsed: true } : s))
  }, [])

  const refillCourage = useCallback(() => {
    setPlayer((s) => ({ ...s, courage: Math.min(COURAGE_MAX, s.courage + 1) }))
  }, [])

  const setReaction = useCallback((r: Reaction) => {
    setPlayer((s) => (s.weekStatus === 'done' ? { ...s, weekReaction: r } : s))
  }, [])

  const addReflection = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setPlayer((s) => ({
      ...s,
      reflections: [{ ts: Date.now(), text: trimmed }, ...s.reflections].slice(
        0,
        20,
      ),
    }))
  }, [])

  const spendCoins = useCallback((amount: number) => {
    let ok = false
    setPlayer((s) => {
      if (s.coins < amount) return s
      ok = true
      return { ...s, coins: s.coins - amount }
    })
    return ok
  }, [])

  /*
    Archives the current week and opens the next one. A week left untouched
    resolves to 'missed' here, same as if a real clock had ticked past it —
    this is what lets the streak-break and history logic be exercised without
    waiting for an actual week to pass.

    Freeze regenerates every two week-transitions, matching Maya's "every two
    weeks, not every week" spec — approximated here with weekIndex parity
    since there's no wall-clock backend yet.
  */
  const rollToNextWeek = useCallback(() => {
    setPlayer((s) => {
      const resolvedStatus = s.weekStatus === 'open' ? 'missed' : s.weekStatus
      const streakBroken = resolvedStatus === 'missed'
      return {
        ...s,
        history: [
          ...s.history,
          {
            weekIndex: s.weekIndex,
            status: resolvedStatus,
            difficulty: s.weekDifficulty,
            xp: s.weekDifficulty ? TIERS[s.weekDifficulty].xp : 0,
            reaction: s.weekReaction,
          },
        ],
        weekIndex: s.weekIndex + 1,
        weekStatus: 'open',
        weekDifficulty: null,
        weekReaction: null,
        streakCurrent: streakBroken ? 0 : s.streakCurrent,
        courage: Math.min(COURAGE_MAX, s.courage + 1),
        freezeTokens:
          s.weekIndex % 2 === 0
            ? Math.min(FREEZE_MAX, s.freezeTokens + 1)
            : s.freezeTokens,
      }
    })
  }, [])

  const resetAll = useCallback(() => setPlayer(mockInitialPlayer), [])

  const value = useMemo(
    () => ({
      player,
      markDone,
      freezeWeek,
      useCowardMode,
      refillCourage,
      setReaction,
      addReflection,
      spendCoins,
      rollToNextWeek,
      resetAll,
    }),
    [
      player,
      markDone,
      freezeWeek,
      useCowardMode,
      refillCourage,
      setReaction,
      addReflection,
      spendCoins,
      rollToNextWeek,
      resetAll,
    ],
  )

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider')
  return ctx
}
