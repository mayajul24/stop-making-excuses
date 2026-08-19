import { useMemo, useState } from 'react'
import type { Difficulty, Reaction } from '../types'
import { TIER_ORDER, TIERS } from '../lib/game'
import { buildPath } from '../lib/path'
import { homeVoice } from '../lib/voice'
import { usePlayer } from '../state/playerStore'
import { Path } from '../components/Path'
import { StreakFlame } from '../components/StreakFlame'
import './Home.css'

const REACTIONS: { id: Reaction; emoji: string; label: string }[] = [
  { id: 'great_date', emoji: '☕', label: 'Great date' },
  { id: 'awkward', emoji: '😬', label: 'Awkward' },
  { id: 'rough', emoji: '💀', label: 'Rough date' },
  { id: 'ghosted', emoji: '👻', label: 'Ghosted' },
  { id: 'second_date', emoji: '❤️', label: 'Second date' },
]

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
  const { player, markDone, freezeToday, chooseEasier, setReaction, addReflection } =
    usePlayer()

  const voice = useMemo(() => homeVoice(player), [player])
  const nodes = useMemo(() => buildPath(player), [player])

  // A session-only override so ⇄ and "I'm anxious" can change which tier is
  // offered without touching committed state — nothing is written to the
  // player until she actually taps DONE.
  const [override, setOverride] = useState<Difficulty | null>(null)
  const [easierBanner, setEasierBanner] = useState(false)
  const [reflectionText, setReflectionText] = useState('')

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
  }

  function handleSaveReflection() {
    addReflection(reflectionText)
    setReflectionText('')
  }

  function renderMissionCard() {
    if (player.dayStatus === 'done') {
      return (
        <div className="donepanel rise">
          <div className="reactionrow">
            {REACTIONS.map((r) => (
              <button
                key={r.id}
                className="reactionchip"
                data-picked={player.dayReaction === r.id}
                onClick={() => setReaction(r.id)}
              >
                {r.emoji} {r.label}
              </button>
            ))}
          </div>

          <textarea
            className="reflectbox"
            placeholder="Want to write how it felt? (optional)"
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
          />
          {reflectionText.trim() && (
            <button className="savebtn" onClick={handleSaveReflection}>
              Save thought
            </button>
          )}

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
          <span className="vital vital--streak">
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
    </div>
  )
}
