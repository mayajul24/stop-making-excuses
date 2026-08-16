import { useMemo } from 'react'
import { completedCount, levelInfo } from '../lib/game'
import { usePlayer } from '../state/playerStore'
import './Progress.css'

/*
  Level + stat grid, matching the official profile screen's 2x2 card layout.
  Levels count challenges completed, not raw XP — so this can't be gamed by
  hoarding easy weeks, and it can't be discouraged by a slow XP climb either.
*/
export function ProgressScreen() {
  const { player } = usePlayer()
  const done = useMemo(() => completedCount(player), [player])
  const info = levelInfo(done)

  const nextLevelAt = done + 1
  const span = 5
  const progressed = done % span

  return (
    <div className="page progressScreen">
      <div className="levelcard">
        <span className="levelcard__badge">{info.badge}</span>
        <h1 className="levelcard__title">{info.title}</h1>
        <span className="levelcard__sub">
          {done} challenge{done === 1 ? '' : 's'} completed · {player.xp} XP
        </span>
        <div className="levelcard__track">
          <div
            className="levelcard__fill"
            style={{ width: `${(progressed / span) * 100}%` }}
          />
        </div>
        <span className="levelcard__next">Level {nextLevelAt} coming up</span>
      </div>

      <div className="statgrid">
        <div className="statcard">
          <span className="statcard__icon">🔥</span>
          <span className="statcard__num">{player.streakCurrent}</span>
          <span className="statcard__lbl">Current streak</span>
        </div>
        <div className="statcard">
          <span className="statcard__icon">🏅</span>
          <span className="statcard__num">{player.streakLongest}</span>
          <span className="statcard__lbl">Longest streak</span>
        </div>
        <div className="statcard">
          <span className="statcard__icon">📅</span>
          <span className="statcard__num">{player.weeksActive}</span>
          <span className="statcard__lbl">Weeks active</span>
        </div>
        <div className="statcard">
          <span className="statcard__icon">❄️</span>
          <span className="statcard__num">{player.freezeTokens}</span>
          <span className="statcard__lbl">Freezes ready</span>
        </div>
      </div>

      {player.reflections.length > 0 && (
        <>
          <span className="label progressScreen__notesLabel">
            Recent thoughts
          </span>
          <div className="notelist">
            {player.reflections.slice(0, 5).map((r) => (
              <div className="note" key={r.ts}>
                {r.text}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
