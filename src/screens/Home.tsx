import { useMemo } from 'react'
import { TIERS, bestAffordable } from '../lib/game'
import { buildPath } from '../lib/path'
import { homeVoice } from '../lib/voice'
import { mockDaysLeft, mockPlayer } from '../data/mock'
import { Path } from '../components/Path'
import './Home.css'

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
  const player = mockPlayer

  const voice = useMemo(() => homeVoice(player, mockDaysLeft), [player])
  const nodes = useMemo(() => buildPath(player), [player])

  // Opens on the hardest thing her Courage can still pay for, so there is
  // always exactly one obvious next action.
  const suggested = bestAffordable(player)
  const tier = suggested ? TIERS[suggested] : null

  /*
    One action, and it has to match the state of the week. A finished week
    must not still be shouting a mission at her — that reads as though what
    she just did didn't count.
  */
  function renderMissionCard() {
    if (player.weekStatus === 'done') {
      return (
        <div className="misscard misscard--muted">
          <span className="misscard__title">Week complete ✓</span>
          <span className="misscard__sub">See you next week.</span>
        </div>
      )
    }
    if (player.weekStatus === 'frozen') {
      return (
        <div className="misscard misscard--muted">
          <span className="misscard__title">Week on ice ❄️</span>
          <span className="misscard__sub">Streak protected.</span>
        </div>
      )
    }
    if (!tier) {
      return (
        <div className="misscard misscard--rose">
          <span className="misscard__eyebrow">Out of courage</span>
          <span className="misscard__title">Refill to keep going</span>
          <button className="misscard__pill misscard__pill--rose">
            👀 Look at profiles — free
          </button>
        </div>
      )
    }
    return (
      <div className="misscard">
        <span className="misscard__eyebrow">
          {tier.rank} · +{tier.xp} XP
        </span>
        <span className="misscard__title">{tier.headline}</span>
        <button className="misscard__pill">START</button>
      </div>
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
          <button className="unitbar__side" aria-label="Change difficulty">
            ⇄
          </button>
        </div>
      </header>

      <div className="home__body">
        <div className={`banner banner--${voice.bannerTone} rise`}>
          <strong className="banner__title">{voice.bannerTitle}</strong>
          <span className="banner__sub">{voice.bannerSub}</span>
        </div>

        <Path nodes={nodes} dogLine={voice.dogLine} dogMood={voice.dogMood} />
      </div>

      <div className="home__dock">{renderMissionCard()}</div>
    </div>
  )
}
