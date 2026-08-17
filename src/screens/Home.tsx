import { useMemo, useState } from 'react'
import type { Difficulty, Reaction } from '../types'
import { TIER_ORDER, TIERS, canAfford, easiestAffordable } from '../lib/game'
import { buildPath } from '../lib/path'
import { homeVoice } from '../lib/voice'
import { daysLeftInWeek } from '../lib/calendar'
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
    chooseEasier,
    markScary,
    refillCourage,
    setReaction,
    addReflection,
  } = usePlayer()

  const daysLeft = useMemo(() => daysLeftInWeek(), [])
  const voice = useMemo(() => homeVoice(player, daysLeft), [player, daysLeft])
  const nodes = useMemo(() => buildPath(player), [player])

  // A session-only override so ⇄ and "I'm scared" can change which tier is
  // offered without touching committed state — nothing is written to the
  // player until she actually taps DONE.
  const [override, setOverride] = useState<Difficulty | null>(null)
  const [easierBanner, setEasierBanner] = useState(false)
  const [reflectionText, setReflectionText] = useState('')

  // Defaults to the gentlest thing she can afford, not the hardest — ⇄ is
  // how she opts into something bigger.
  const suggested = easiestAffordable(player)
  const selected = override ?? suggested
  const tier = selected ? TIERS[selected] : null

  function cycleDifficulty() {
    const affordable = TIER_ORDER.filter((d) => canAfford(player, d))
    if (affordable.length <= 1) return
    const current = selected ?? affordable[0]
    const i = affordable.indexOf(current)
    setOverride(affordable[(i + 1) % affordable.length])
    setEasierBanner(false)
  }

  // The "I'm scared" branch — steps down exactly one rung from whatever's
  // currently offered rather than always jumping to a fixed tier, so it
  // stays "a little smaller" instead of overcorrecting to the floor.
  function handleScared() {
    chooseEasier()
    const affordable = TIER_ORDER.filter((d) => canAfford(player, d))
    const current = selected ?? affordable[0]
    const i = affordable.indexOf(current)
    setOverride(affordable[Math.max(0, i - 1)])
    setEasierBanner(true)
  }

  function handleMarkDone() {
    if (!selected) return
    markDone(selected)
    setOverride(null)
    setEasierBanner(false)
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
            <span className="donepanel__title">
              {player.weekMarkedScary
                ? '😬 Scared, and did it anyway.'
                : 'That counts.'}
            </span>
            <span className="donepanel__sub">
              {completedTier ? `${completedTier.done} · ` : ''}Maya's been
              notified 👀
            </span>
          </div>

          {!player.weekMarkedScary ? (
            <button className="scarytoggle" onClick={markScary}>
              😰 Honestly? That felt scary — claim +{10} bonus Courage
            </button>
          ) : (
            <div className="scarytoggle scarytoggle--done">
              😬 Bonus Courage claimed. You didn’t need to conquer dating
              today — one tiny win is the whole point.
            </div>
          )}

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

          <p className="nextweeknote">
            Next week opens on its own once this one's really over.
          </p>
        </div>
      )
    }

    if (player.weekStatus === 'frozen') {
      return (
        <div className="donepanel donepanel--frozen rise">
          <span className="donepanel__title">Week on ice ❄️</span>
          <span className="donepanel__sub">Streak protected.</span>
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
        {easierBanner && (
          <div className="easiernote rise">
            Okay. No pressure. Let's make it smaller.
          </div>
        )}
        <div className="secondary-row">
          <button className="secondary-btn" onClick={refillCourage}>
            👀 Free look +1
          </button>
          <button className="secondary-btn" onClick={handleScared}>
            😨 I'm scared
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
            {tier.rank} · +{tier.xp} Courage
          </span>
          <span className="misscard__title">{tier.headline}</span>
          <div className="misscard__row">
            <button className="misscard__pill" onClick={handleMarkDone}>
              DONE ✓
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
