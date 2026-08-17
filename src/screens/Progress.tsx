import { useMemo } from 'react'
import { completedCount, levelInfo } from '../lib/game'
import { daysIntoWeek } from '../lib/calendar'
import { nextPushNotification } from '../lib/notifications'
import { usePlayer } from '../state/playerStore'
import { PushToggle } from '../components/PushToggle'
import './Progress.css'

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/*
  Level + stat grid, matching the official profile screen's 2x2 card layout.
  Levels count challenges completed, not raw XP — so this can't be gamed by
  hoarding easy weeks, and it can't be discouraged by a slow XP climb either.
*/
export function ProgressScreen() {
  const { player, resetAll } = usePlayer()
  const done = useMemo(() => completedCount(player), [player])
  const info = levelInfo(done)

  const nextLevelAt = done + 1
  const span = 5
  const progressed = done % span

  // Oldest vs newest reflection — proof of growth, not a diary. Needs at
  // least two entries or there's nothing to compare against.
  const oldest = player.reflections[player.reflections.length - 1]
  const newest = player.reflections[0]
  const showGrowth = player.reflections.length >= 2

  // Preview only — proves the trigger logic picks the right message without
  // an actual delivery pipeline behind it yet.
  const preview = useMemo(
    () => nextPushNotification(player, daysIntoWeek(), player.weekIndex),
    [player],
  )

  return (
    <div className="page progressScreen">
      <div className="levelcard">
        <span className="levelcard__badge">{info.badge}</span>
        <h1 className="levelcard__title">{info.title}</h1>
        <span className="levelcard__sub">
          {done} brave action{done === 1 ? '' : 's'} · {player.xp} Courage XP
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
          <span className="statcard__lbl">Weeks showing up</span>
        </div>
        <div className="statcard">
          <span className="statcard__icon">🏅</span>
          <span className="statcard__num">{player.streakLongest}</span>
          <span className="statcard__lbl">Best streak</span>
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

      {showGrowth && (
        <div className="growthcard">
          <span className="label">You vs. you</span>
          <div className="growthcard__row">
            <span className="growthcard__tag">{fmtDate(oldest.ts)}</span>
            <p className="growthcard__text">“{oldest.text}”</p>
          </div>
          <div className="growthcard__row growthcard__row--now">
            <span className="growthcard__tag">{fmtDate(newest.ts)}</span>
            <p className="growthcard__text">“{newest.text}”</p>
          </div>
        </div>
      )}

      <div className="pushpreview">
        <span className="label">🔔 Notifications</span>
        <PushToggle />
        {preview ? (
          <div className="pushpreview__card">
            <span className="pushpreview__title">
              What tonight's would say
            </span>
            <span className="pushpreview__body">{preview.body}</span>
          </div>
        ) : (
          <p className="pushpreview__quiet">
            Nothing to send right now — she's good.
          </p>
        )}
      </div>

      <button
        className="resetlink"
        onClick={() => {
          if (confirm('Reset all progress? This can’t be undone.')) resetAll()
        }}
      >
        Reset progress
      </button>
    </div>
  )
}
