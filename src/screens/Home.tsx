import { useMemo } from 'react'
import { TIERS, bestAffordable } from '../lib/game'
import { buildPath } from '../lib/path'
import { homeVoice } from '../lib/voice'
import { mockDaysLeft, mockPlayer } from '../data/mock'
import { Path } from '../components/Path'
import './Home.css'

export function Home() {
  const player = mockPlayer

  const voice = useMemo(() => homeVoice(player, mockDaysLeft), [player])
  const nodes = useMemo(() => buildPath(player), [player])

  // Opens on the hardest thing her Courage can still pay for, so there is
  // always exactly one obvious next action.
  const suggested = bestAffordable(player)
  const tier = suggested ? TIERS[suggested] : null

  const unit =
    player.weekStatus === 'done'
      ? { eyebrow: `Week ${player.weekIndex}`, title: 'Done for this week' }
      : player.weekStatus === 'frozen'
        ? { eyebrow: `Week ${player.weekIndex}`, title: 'Week on ice' }
        : tier
          ? {
              eyebrow: `Week ${player.weekIndex} · ${tier.rank}`,
              title: tier.headline,
            }
          : { eyebrow: `Week ${player.weekIndex}`, title: 'Out of courage' }

  /*
    One action, and it has to match the state of the week. A finished week
    must not still be shouting "next step" at her — that reads as though
    what she just did didn't count.
  */
  function renderAction() {
    if (player.weekStatus === 'done') {
      return <div className="done-note">Week complete ✓ &nbsp;See you next week.</div>
    }
    if (player.weekStatus === 'frozen') {
      return <div className="done-note">Week on ice ❄️ &nbsp;Streak protected.</div>
    }
    if (!tier) {
      return <button className="btn btn--rose">💗 OUT OF COURAGE — REFILL</button>
    }
    return <button className="btn">NEXT STEP: {tier.action}</button>
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
            <span className="unitbar__eyebrow">{unit.eyebrow}</span>
            <span className="unitbar__title">{unit.title}</span>
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

      <div className="home__dock">{renderAction()}</div>
    </div>
  )
}
