import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Difficulty, PlayerState, Reaction } from '../types'
import { COURAGE_MAX, FREEZE_MAX, TIERS } from '../lib/game'
import { currentWeekIndex } from '../lib/calendar'
import { mockInitialPlayer } from '../data/mock'
import { supabase } from '../lib/supabaseClient'

const STORAGE_KEY = 'stami:player'

/*
  Every mutation the app can make to a PlayerState, in one place. This is
  local state persisted to localStorage today; the point of keeping every
  write behind these functions rather than scattered setState calls is that
  swapping in a real backend later means rewriting this file's insides, not
  every screen that touches the player.
*/
interface PlayerActions {
  markDone: (difficulty: Difficulty) => void
  freezeWeek: () => void
  chooseEasier: () => void
  refillCourage: () => void
  setReaction: (r: Reaction) => void
  addReflection: (text: string) => void
  spendCoins: (amount: number) => boolean
  resetAll: () => void
}

const PlayerContext = createContext<
  { player: PlayerState } & PlayerActions
>(null as never)

/** A brand-new player, anchored to whatever the real current week is. */
function freshPlayer(): PlayerState {
  return { ...mockInitialPlayer, weekIndex: currentWeekIndex() }
}

/**
 * Archives one week and opens the next — pure, so it can run in a loop to
 * catch up several real weeks at once (the app closed for a while) without
 * duplicating this logic in a UI action. A week left open resolves to
 * 'missed', which is what breaks the streak.
 *
 * Freeze regenerates every two week-transitions, matching the "every two
 * weeks, not every week" spec, approximated with weekIndex parity — good
 * enough without a scheduled job counting real elapsed weeks.
 */
function advanceWeek(s: PlayerState): PlayerState {
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
}

/** Runs advanceWeek as many times as real calendar weeks have passed. */
function catchUpToNow(s: PlayerState): PlayerState {
  const target = currentWeekIndex()
  let next = s
  while (next.weekIndex < target) next = advanceWeek(next)
  return next
}

function loadPlayer(): PlayerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return freshPlayer()
    return catchUpToNow(JSON.parse(raw) as PlayerState)
  } catch {
    return freshPlayer()
  }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<PlayerState>(loadPlayer)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(player))
    } catch {
      // Private-browsing / storage-full: the session still works, it just
      // won't survive a reload. Not worth surfacing to her over this.
    }

    // Mirrored to Supabase, fire-and-forget, so the nightly cron job (which
    // runs server-side with no access to this browser's localStorage) has
    // something current to read. localStorage stays the source of truth
    // for the browser itself — this is a write-through sync, not a two-way
    // one; the app doesn't read its own state back from Supabase.
    supabase
      ?.from('player_state')
      .upsert({ id: 1, data: player, updated_at: new Date().toISOString() })
      .then(({ error }) => {
        if (error) console.error('player_state sync failed', error)
      })
  }, [player])

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

  // Never fails, never marks the week done — it just quietly offers
  // something smaller so there's always an easier door out.
  const chooseEasier = useCallback(() => {
    setPlayer((s) => (s.weekStatus === 'open' ? { ...s, wentEasier: true } : s))
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

  const resetAll = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    setPlayer(freshPlayer())
  }, [])

  const value = useMemo(
    () => ({
      player,
      markDone,
      freezeWeek,
      chooseEasier,
      refillCourage,
      setReaction,
      addReflection,
      spendCoins,
      resetAll,
    }),
    [
      player,
      markDone,
      freezeWeek,
      chooseEasier,
      refillCourage,
      setReaction,
      addReflection,
      spendCoins,
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
