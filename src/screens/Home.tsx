import { useMemo, useState } from 'react'
import type { Difficulty, Reaction } from '../types'
import { TIER_ORDER, TIERS, bestAffordable, canAfford } from '../lib/game'
import { buildPath } from '../lib/path'
import { homeVoice } from '../lib/voice'
import { mockDaysLeft } from '../data/mock'
import { usePlayer } from '../state/playerStore'
import { Path } from '../components/Path'
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
  the pinned green bar carries the week-level status (context, always true),
  the docked card at the bottom carries the specific mission (the one thing
  she can act on right now). They should never say the same sentence twice.
*/
function statusLine(status: 'open' | 'done' | 'frozen' | 'missed', hasTier: boolean) {
  if (status === 'done') return 'Nice work this week'
  if (status === 'frozen') return 'Resting this week'
  if (!hasTier) return 'Out of courage'
  return 'Choose your challenge'
}

export function Home() {
  const {
    player,
    markDone,
    freezeWeek,
    useCowardMode,
    refillCourage,
    setReaction,
    addReflection,
    rollToNextWeek,
  } = usePlayer()

  const voice = useMemo(() => homeVoice(player, mockDaysLeft), [player])
  const nodes = useMemo(() => buildPath(player), [player])

  // A session-only override so ⇄ and Coward Mode can change which tier is
  // offered without touching committed state — nothing is written to the
  // player until she actually taps START.
  const [override, setOverride] = useState<Difficulty | null>(null)
  const [cowardBanner, setCowardBanner] = useState(false)
  const [reflectionText, setReflectionText] = useState('')

  const suggested = bestAffordable(player)
  const selected = override ?? suggested
  const tier = selected ? TIERS[selected] : null

  function cycleDifficulty() {
    const affordable = TIER_ORDER.filter((d) => canAfford(player, d))
    if (affordable.length <= 1) return
    const current = selected ?? affordable[0]
    const i = affordable.indexOf(current)
    setOverride(affordable[(i + 1) % affordable.length])
    setCowardBanner(false)
  }

  function handleCoward() {
    useCowardMode()
    setOverride('medium')
    setCowardBanner(true)
  }

  function handleStart() {
    if (!selected) return
    markDone(selected)
    setOverride(null)
  }

  function handleContinue() {
    rollToNextWeek()
    setOverride(null)
    setCowardBanner(false)
    setReflectionText('')
  }

  function handleSaveReflection() {
    addReflection(reflectionText)
    setReflectionText('')
  }

  function renderMissionCard() {
    if (player.weekStatus === 'done') {
      // Not `tier` — that now reflects the *next* suggested mission (likely
      // null, since courage was just spent), not what she actually did.
      const completedTier = player.weekDifficulty
        ? TIERS[player.weekDifficulty]
        : null
      return (
        <div className="donepanel rise">
          <div className="donepanel__head">
            <span className="donepanel__title">Week complete ✓</span>
            <span className="donepanel__sub">
              {completedTier ? `${completedTier.done} · ` : ''}Maya's been
              notified 👀
            </span>
          </div>

          <div className="reactionrow">
            {REACTIONS.map((r) => (
              <button
                key={r.id}
                className="reactionchip"
                data-picked={player.weekReaction === r.id}
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

          <button className="continuebtn" onClick={handleContinue}>
            Continue to next week →
          </button>
        </div>
      )
    }

    if (player.weekStatus === 'frozen') {
      return (
        <div className="donepanel donepanel--frozen rise">
          <span className="donepanel__title">Week on ice ❄️</span>
          <span className="donepanel__sub">Streak protected.</span>
          <button className="continuebtn" onClick={handleContinue}>
            Continue to next week →
          </button>
        </div>
      )
    }

    if (!tier) {
      return (
        <div className="misscard misscard--rose">
          <span className="misscard__eyebrow">Out of courage</span>
          <span className="misscard__title">Refill to keep going</span>
          <button className="misscard__pill misscard__pill--rose" onClick={refillCourage}>
            👀 Look at profiles — free
          </button>
        </div>
      )
    }

    return (
      <>
        {cowardBanner && (
          <div className="cowardnote rise">Fine 🙄 Let's start easier.</div>
        )}
        <div className="secondary-row">
          <button className="secondary-btn" onClick={refillCourage}>
            👀 Free look +1
          </button>
          <button className="secondary-btn" onClick={handleCoward}>
            😩 Too much
          </button>
          <button
            className="secondary-btn"
            onClick={freezeWeek}
            disabled={player.freezeTokens <= 0}
          >
            ❄️ Freeze ({player.freezeTokens})
          </button>
        </div>
        <div className="misscard">
          <span className="misscard__eyebrow">
            {tier.rank} · +{tier.xp} XP
          </span>
          <span className="misscard__title">{tier.headline}</span>
          <div className="misscard__row">
            <button className="misscard__pill" onClick={handleStart}>
              START
            </button>
            {TIER_ORDER.filter((d) => canAfford(player, d)).length > 1 && (
              <button
                className="misscard__swap"
                onClick={cycleDifficulty}
                aria-label="Try a different difficulty"
              >
                ⇄
              </button>
            )}
          </div>
        </div>
        <button className="skiplink" onClick={handleContinue}>
          Skip this week anyway (testing) →
        </button>
      </>
    )
  }

  return (
    <div className="page home">
      {/* Stays put however far down the journey she scrolls. */}
      <header className="hud">
        <div className="vitals">
          <span className="vital vital--streak">
            🔥 <b>{player.streakCurrent}</b>
          </span>
          <span className="vital vital--courage">
            💗 <b>{player.courage}</b>
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
            <span className="unitbar__eyebrow">Week {player.weekIndex}</span>
            <span className="unitbar__title">
              {statusLine(player.weekStatus, !!tier)}
            </span>
          </div>
        </div>
      </header>

      <div className="home__body">
        <div className={`banner banner--${voice.bannerTone} rise`}>
          <strong className="banner__title">{voice.bannerTitle}</strong>
          <span className="banner__sub">{voice.bannerSub}</span>
        </div>

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
