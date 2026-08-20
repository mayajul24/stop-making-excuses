import { useMemo, useRef, useState } from 'react'
import type { Difficulty } from '../types'
import { TIER_ORDER, TIERS } from '../lib/game'
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

  // Only true right after she taps DONE this session — revisiting Home
  // later the same day (already done from an earlier visit) shouldn't
  // replay the celebration.
  const [celebrating, setCelebrating] = useState(false)

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

  function cycleDifficulty() {
    const i = TIER_ORDER.indexOf(selected)
    setOverride(TIER_ORDER[(i + 1) % TIER_ORDER.length])
    setEasierBanner(false)
  }

  // The "I'm anxious" branch — steps down exactly one rung from whatever's
  // currently offered rather than always jumping to a fixed tier, so it
  // stays "a little smaller" instead of overcorrecting to the floor.
  function handleAnxious() {
    chooseEasier()
    const i = TIER_ORDER.indexOf(selected)
    setOverride(TIER_ORDER[Math.max(0, i - 1)])
    setEasierBanner(true)
  }

  function handleMarkDone() {
    markDone(selected)
    setOverride(null)
    setEasierBanner(false)
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
      <>
        {easierBanner && (
          <div className="easiernote rise">
            Okay. No pressure. Let's make it smaller.
          </div>
        )}
        <div className="secondary-row">
          <button className="secondary-btn" onClick={handleAnxious}>
            😰 I'm anxious
          </button>
          <button
            className="secondary-btn"
            onClick={freezeToday}
            disabled={player.freezeTokens <= 0}
          >
            ❄️ Freeze ({player.freezeTokens})
          </button>
        </div>
        <div className="misscard">
          <span className="misscard__eyebrow">
            {tier.rank} · +{tier.xp} Courage
          </span>
          <span className="misscard__title">{tier.headline}</span>
          <div className="misscard__row">
            <button className="misscard__pill" onClick={handleMarkDone}>
              DONE ✓
            </button>
            <button
              className="misscard__swap"
              onClick={cycleDifficulty}
              aria-label="Try a different difficulty"
            >
              ⇄
            </button>
          </div>
        </div>
      </>
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
        />
      </div>

      <div className="home__dock">{renderMissionCard()}</div>

      {celebrating && (
        <StreakCelebration
          streak={player.streakCurrent}
          onContinue={() => setCelebrating(false)}
        />
      )}

      {debugOpen && (
        <DebugPanel
          streak={player.streakCurrent}
          onPreviewStreak={() => setCelebrating(true)}
          onClose={() => setDebugOpen(false)}
        />
      )}
    </div>
  )
}
