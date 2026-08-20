import { useMemo } from 'react'
import { StreakFlame } from './StreakFlame'
import './StreakCelebration.css'

/*
  Replaces the old "how did it feel" panel that used to appear the moment
  she tapped DONE — she asked for that gone, and for a Duolingo-style
  streak celebration (confetti + the streak count) in its place. Random
  per-piece confetti positions/timing are computed once via useMemo so
  they don't reshuffle on every re-render while this is showing.
*/

const CONFETTI_COLORS = ['var(--orange)', 'var(--gold)', 'var(--lilac)', 'var(--green)', '#fff8ec']

function useConfettiPieces(count: number) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        // Held back until the flame fill + number pop finish, so the
        // sequence reads: flame lights up -> number lands -> confetti.
        delay: 0.85 + Math.random() * 0.35,
        duration: 2.1 + Math.random() * 1.3,
        drift: Math.round((Math.random() - 0.5) * 70),
      })),
    [count],
  )
}

export function StreakCelebration({
  streak,
  previousStreak,
  onContinue,
}: {
  streak: number
  previousStreak: number
  onContinue: () => void
}) {
  const pieces = useConfettiPieces(46)
  const showTransition = previousStreak !== streak

  return (
    <div className="celebrate">
      <div className="celebrate__confetti" aria-hidden="true">
        {pieces.map((p) => (
          <span
            key={p.id}
            className="celebrate__piece"
            style={
              {
                left: `${p.left}%`,
                background: p.color,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                '--drift': `${p.drift}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="celebrate__flame-stack">
        <div className="celebrate__flame-base">
          <StreakFlame lit={false} size={104} />
        </div>
        <div className="celebrate__flame-fill">
          <StreakFlame lit size={104} />
        </div>
      </div>

      {/* Slides the old count up and out while the new one slides up and
          in from below — the odometer-flip Duolingo itself uses, rather
          than just popping the final number straight in. */}
      <div className="celebrate__streak-wrap">
        {showTransition && (
          <span className="celebrate__streak-digit celebrate__streak-digit--old">
            {previousStreak}
          </span>
        )}
        <span
          className={`celebrate__streak-digit ${
            showTransition ? 'celebrate__streak-digit--new' : 'celebrate__streak-digit--pop'
          }`}
        >
          {streak}
        </span>
      </div>

      <div className="celebrate__title">{streak} day streak!</div>
      <div className="celebrate__sub">Nice work today.</div>
      <button className="celebrate__continue" onClick={onContinue}>
        Continue
      </button>
    </div>
  )
}
