import { useMemo } from 'react'
import { ACHIEVEMENTS, fullHistory } from '../lib/game'
import { mockPlayer } from '../data/mock'
import './Wins.css'

/*
  Achievements, collectible-card style. Rewards bravery and consistency, not
  romantic outcomes — every condition here comes straight from game.ts, so
  this screen can't drift out of sync with what actually unlocks things.
*/
export function Wins() {
  const player = mockPlayer
  const history = useMemo(() => fullHistory(player), [player])

  const unlocked = ACHIEVEMENTS.filter((a) => a.earned(history, player))
  const locked = ACHIEVEMENTS.filter((a) => !a.earned(history, player))

  return (
    <div className="page wins">
      <div className="wins__head">
        <span className="label">Achievements</span>
        <h1 className="wins__count">
          {unlocked.length} <span>/ {ACHIEVEMENTS.length}</span>
        </h1>
      </div>

      <div className="wins__grid">
        {[...unlocked, ...locked].map((a) => {
          const isUnlocked = unlocked.includes(a)
          return (
            <div
              key={a.id}
              className="wincard"
              data-unlocked={isUnlocked}
            >
              <span className="wincard__emoji">{a.emoji}</span>
              <span className="wincard__title">{a.title}</span>
              <span className="wincard__blurb">
                {isUnlocked ? a.blurb : '???'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
