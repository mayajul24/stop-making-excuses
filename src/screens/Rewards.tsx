import { mockMayaRewards, mockPlayer, mockSelfRewards } from '../data/mock'
import './Rewards.css'

/*
  Two separate currencies on purpose. Coins buy small treats and never touch
  her level. Maya rewards are locked to lifetime XP and can't be redeemed —
  they just prove she's earned them, so Maya has to follow through.
*/
export function Rewards() {
  const player = mockPlayer

  return (
    <div className="page rewards">
      <div className="rewards__head">
        <span className="label">Rewards</span>
        <h1 className="rewards__coins">💛 {player.coins}</h1>
      </div>

      <span className="label rewards__section">From Maya</span>
      <div className="mayalist">
        {mockMayaRewards
          .slice()
          .sort((a, b) => a.xpThreshold - b.xpThreshold)
          .map((r) => {
            const unlocked = player.xp >= r.xpThreshold
            return (
              <div className="mayacard" key={r.id} data-unlocked={unlocked}>
                <div className="mayacard__top">
                  <span>{r.xpThreshold} XP</span>
                  <span>{unlocked ? '🏆 Unlocked' : '🔒 Locked'}</span>
                </div>
                <div className="mayacard__title">{r.title}</div>
              </div>
            )
          })}
      </div>

      <span className="label rewards__section">Treat yourself</span>
      <div className="selflist">
        {mockSelfRewards.map((r) => {
          const can = player.coins >= r.cost
          return (
            <div className="selfcard" key={r.id}>
              <div className="selfcard__info">
                <div className="selfcard__title">{r.title}</div>
                <div className="selfcard__cost">💛 {r.cost}</div>
              </div>
              <button className="selfcard__btn" disabled={!can}>
                Redeem
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
