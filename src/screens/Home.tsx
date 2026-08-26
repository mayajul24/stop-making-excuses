import { useEffect, useMemo, useRef, useState } from 'react'
import type { Difficulty } from '../types'
import { TIER_ORDER, TIERS, tierVariant } from '../lib/game'
import { buildPath } from '../lib/path'
import { homeVoice } from '../lib/voice'
import { usePlayer } from '../state/playerStore'
import { Path } from '../components/Path'
import { StreakFlame } from '../components/StreakFlame'
import { StreakCelebration } from '../components/StreakCelebration'
import { DebugPanel } from '../components/DebugPanel'
import './Home.css'

/*
  Mirrors the two-tier hierarchy from Duolingo's real unit bar + lesson card:
  the pinned green bar carries the day-level status (context, always true),
  the docked card at the bottom carries the specific mission (the one thing
  she can act on right now). They should never say the same sentence twice.
  While today's still open, the docked card stays hidden until she taps the
  live node on the path — matching the reference, where the circle itself
  is what surfaces the "start" sheet rather than it sitting there by default.
*/
function statusLine(status: 'open' | 'done' | 'frozen' | 'missed') {
  if (status === 'done') return 'Nice work today'
  if (status === 'frozen') return 'Resting today'
  return 'Choose your challenge'
}

export function Home() {
  const { player, markDone, freezeToday, chooseEasier } = usePlayer()

  const voice = useMemo(() => homeVoice(player), [player])
  const nodes = useMemo(() => buildPath(player), [player])

  // A session-only override so ⇄ and "I'm anxious" can change which tier is
  // offered without touching committed state — nothing is written to the
  // player until she actually taps DONE.
  const [override, setOverride] = useState<Difficulty | null>(null)
  const [easierBanner, setEasierBanner] = useState(false)

  // The mission card doesn't sit docked by default anymore — she taps the
  // live node on the path to bring it up, matching the reference. Only
  // matters while today's still open; done/frozen panels always show.
  const [missionOpen, setMissionOpen] = useState(false)
  // Without this, "already tapped open" would carry over from yesterday's
  // card into a fresh day that hasn't been tapped yet.
  useEffect(() => {
    setMissionOpen(false)
  }, [player.dayIndex])

  // Only true right after she taps DONE this session — revisiting Home
  // later the same day (already done from an earlier visit) shouldn't
  // replay the celebration.
  const [celebrating, setCelebrating] = useState(false)
  // Captured the moment DONE is tapped, before markDone updates the
  // player — lets the celebration animate FROM the old count TO the new
  // one instead of just popping in the final number.
  const [prevStreak, setPrevStreak] = useState(0)

  // Hidden test menu — 6 taps on the streak flame within 1.5s opens it.
  // Not linked from anywhere visible, so it won't get found by accident.
  const [debugOpen, setDebugOpen] = useState(false)
  const tapTimes = useRef<number[]>([])
  function handleStreakTap() {
    const now = Date.now()
    tapTimes.current = tapTimes.current.filter((t) => now - t < 1500)
    tapTimes.current.push(now)
    if (tapTimes.current.length >= 6) {
      tapTimes.current = []
      setDebugOpen(true)
    }
  }

  // Always defaults to Easy, not whatever's "hardest available" — there's
  // no resource gating difficulty anymore (see game.ts), so the app has to
  // be the one holding the line on suggesting the gentlest thing first.
  // Escalating is something she opts into via ⇄, never the default.
  const selected = override ?? 'easy'
  const tier = TIERS[selected]
  const variant = tierVariant(tier, player.dayIndex)

  function cycleDifficulty() {
    const i = TIER_ORDER.indexOf(selected)
    setOverride(TIER_ORDER[(i + 1) % TIER_ORDER.length])
    setEasierBanner(false)
  }

  // The "I'm anxious" branch — steps down exactly one rung from whatever's
  // currently offered rather than always jumping to a fixed tier, so it
  // stays "a little smaller" instead of overcorrecting to the floor.
  // Disabled in the JSX once she's already on the easiest tier, so this
  // never gets called with nowhere left to step down to.
  function handleAnxious() {
    chooseEasier()
    const i = TIER_ORDER.indexOf(selected)
    setOverride(TIER_ORDER[i - 1])
    setEasierBanner(true)
  }

  function handleMarkDone() {
    setPrevStreak(player.streakCurrent)
    markDone(selected)
    setOverride(null)
    setEasierBanner(false)
    setCelebrating(true)
  }

  // Debug-only: simulates the same "old -> new" jump a real completion
  // would produce, since there's no real prior state to capture here.
  function handlePreviewStreak() {
    setPrevStreak(Math.max(0, player.streakCurrent - 1))
    setCelebrating(true)
  }

  function renderMissionCard() {
    if (player.dayStatus === 'done') {
      return (
        <div className="donepanel rise">
          <span className="donepanel__title">Nice work today ✓</span>
          <p className="nextdaynote">
            Tomorrow opens on its own once today's really over.
          </p>
        </div>
      )
    }

    if (player.dayStatus === 'frozen') {
      return (
        <div className="donepanel donepanel--frozen rise">
          <span className="donepanel__title">Today's on ice ❄️</span>
          <span className="donepanel__sub">Streak protected.</span>
        </div>
      )
    }

    return (
      <div className="misscard rise">
        <span className="misscard__eyebrow">
          {tier.rank} · +{tier.xp} XP
        </span>
        <span className="misscard__title">{variant.headline}</span>

        <button className="misscard__pill misscard__pill--primary" onClick={handleMarkDone}>
          Just do it!
        </button>
        <button
          className="misscard__pill misscard__pill--anxious"
          onClick={handleAnxious}
          disabled={selected === TIER_ORDER[0]}
        >
          😰 I'm anxious — swap the task
        </button>

        {easierBanner && (
          <div className="easiernote rise">
            Okay. No pressure. Let's make it smaller.
          </div>
        )}

        <div className="misscard__extra">
          <button className="misscard__link" onClick={cycleDifficulty}>
            ⇄ Try something else
          </button>
          <button
            className="misscard__link"
            onClick={freezeToday}
            disabled={player.freezeTokens <= 0}
          >
            ❄️ Freeze ({player.freezeTokens})
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page home">
      {/* Stays put however far down the journey she scrolls. */}
      <header className="hud">
        <div className="vitals">
          <span className="vital vital--streak" onClick={handleStreakTap}>
            <StreakFlame lit={player.streakCurrent > 0} size={20} />
            <b>{player.streakCurrent}</b>
          </span>
          <span className="vital vital--xp">
            ⭐ <b>{player.xp}</b>
          </span>
          <span className="vital vital--freeze">
            ❄️ <b>{player.freezeTokens}</b>
          </span>
        </div>

        <div className="unitbar">
          <div className="unitbar__text">
            <span className="unitbar__eyebrow">Today</span>
            <span className="unitbar__title">
              {statusLine(player.dayStatus)}
            </span>
          </div>
        </div>
      </header>

      <div className="home__body">
        <Path
          nodes={nodes}
          mascotLine={voice.mascotLine}
          mascotMood={voice.mascotMood}
          onLiveNodeClick={() => setMissionOpen(true)}
        />
      </div>

      {(player.dayStatus !== 'open' || missionOpen) && (
        <div className="home__dock">{renderMissionCard()}</div>
      )}

      {celebrating && (
        <StreakCelebration
          streak={player.streakCurrent}
          previousStreak={prevStreak}
          onContinue={() => setCelebrating(false)}
        />
      )}

      {debugOpen && (
        <DebugPanel
          streak={player.streakCurrent}
          onPreviewStreak={handlePreviewStreak}
          onClose={() => setDebugOpen(false)}
        />
      )}
    </div>
  )
}
