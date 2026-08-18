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
import { FREEZE_MAX, TIERS } from '../lib/game'
import { currentDayIndex } from '../lib/calendar'
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
  freezeToday: () => void
  chooseEasier: () => void
  setReaction: (r: Reaction) => void
  addReflection: (text: string) => void
  spendCoins: (amount: number) => boolean
  resetAll: () => void
}

const PlayerContext = createContext<
  { player: PlayerState } & PlayerActions
>(null as never)

/** A brand-new player, anchored to whatever the real current day is. */
function freshPlayer(): PlayerState {
  return { ...mockInitialPlayer, dayIndex: currentDayIndex() }
}

/**
 * Archives one day and opens the next — pure, so it can run in a loop to
 * catch up several real days at once (the app closed for a while) without
 * duplicating this logic in a UI action. A day left open resolves to
 * 'missed', which is what breaks the streak.
 *
 * Freeze regenerates every 14 day-transitions — the same real-world two
 * weeks the old weekly version regenerated it every 2 week-transitions,
 * just expressed in the new atomic unit.
 */
function advanceDay(s: PlayerState): PlayerState {
  const resolvedStatus = s.dayStatus === 'open' ? 'missed' : s.dayStatus
  const streakBroken = resolvedStatus === 'missed'
  return {
    ...s,
    history: [
      ...s.history,
      {
        dayIndex: s.dayIndex,
        status: resolvedStatus,
        difficulty: s.dayDifficulty,
        xp: s.dayDifficulty ? TIERS[s.dayDifficulty].xp : 0,
        reaction: s.dayReaction,
      },
    ],
    dayIndex: s.dayIndex + 1,
    dayStatus: 'open',
    dayDifficulty: null,
    dayReaction: null,
    streakCurrent: streakBroken ? 0 : s.streakCurrent,
    freezeTokens:
      s.dayIndex % 14 === 0
        ? Math.min(FREEZE_MAX, s.freezeTokens + 1)
        : s.freezeTokens,
  }
}

/** Runs advanceDay as many times as real calendar days have passed. */
function catchUpToNow(s: PlayerState): PlayerState {
  const target = currentDayIndex()
  let next = s
  while (next.dayIndex < target) next = advanceDay(next)
  return next
}

// Guards against a shape from before some past PlayerState field rename
// (there's no schema version tag, so this is the only thing standing
// between a stale save and a silently broken app). Without this,
// JSON.parse(raw) as PlayerState is just a type *assertion* — TypeScript
// trusts it unconditionally, but at runtime a save from an old field-name
// era comes back with dayIndex/dayStatus simply undefined. That doesn't
// throw anywhere: catchUpToNow's `next.dayIndex < target` is `undefined <
// number`, which JavaScript evaluates as false, so the catch-up loop
// silently never runs, and the broken object passes through untouched —
// looking like an ordinary open day in the UI while every day-index check
// server-side quietly fails.
function isValidPlayerState(v: unknown): v is PlayerState {
  if (!v || typeof v !== 'object') return false
  const s = v as Record<string, unknown>
  return (
    typeof s.dayIndex === 'number' &&
    typeof s.dayStatus === 'string' &&
    Array.isArray(s.history)
  )
}

function loadPlayer(): PlayerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return freshPlayer()
    const parsed: unknown = JSON.parse(raw)
    if (!isValidPlayerState(parsed)) return freshPlayer()
    return catchUpToNow(parsed)
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
      if (s.dayStatus !== 'open') return s
      const tier = TIERS[difficulty]
      const streakCurrent = s.streakCurrent + 1
      return {
        ...s,
        xp: s.xp + tier.xp,
        coins: s.coins + tier.xp,
        dayStatus: 'done',
        dayDifficulty: difficulty,
        dayReaction: null,
        streakCurrent,
        streakLongest: Math.max(s.streakLongest, streakCurrent),
        daysActive: s.daysActive + 1,
      }
    })
  }, [])

  const freezeToday = useCallback(() => {
    setPlayer((s) => {
      if (s.dayStatus !== 'open' || s.freezeTokens <= 0) return s
      return { ...s, dayStatus: 'frozen', freezeTokens: s.freezeTokens - 1 }
    })
  }, [])

  // Never fails, never marks the day done — it just quietly offers
  // something smaller so there's always an easier door out.
  const chooseEasier = useCallback(() => {
    setPlayer((s) => (s.dayStatus === 'open' ? { ...s, wentEasier: true } : s))
  }, [])

  const setReaction = useCallback((r: Reaction) => {
    setPlayer((s) => (s.dayStatus === 'done' ? { ...s, dayReaction: r } : s))
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
      freezeToday,
      chooseEasier,
      setReaction,
      addReflection,
      spendCoins,
      resetAll,
    }),
    [
      player,
      markDone,
      freezeToday,
      chooseEasier,
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
