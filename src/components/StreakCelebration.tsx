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
        delay: Math.random() * 0.35,
        duration: 2.1 + Math.random() * 1.3,
        drift: Math.round((Math.random() - 0.5) * 70),
      })),
    [count],
  )
}

export function StreakCelebration({
  streak,
  onContinue,
}: {
  streak: number
  onContinue: () => void
}) {
  const pieces = useConfettiPieces(46)

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

      <div className="celebrate__flame">
        <StreakFlame lit size={72} />
      </div>
      <div className="celebrate__streak">{streak}</div>
      <div className="celebrate__title">
        {streak > 1 ? `${streak} day streak!` : 'Streak started!'} 🎉
      </div>
      <div className="celebrate__sub">Nice work today.</div>
      <button className="celebrate__continue" onClick={onContinue}>
        Continue
      </button>
    </div>
  )
}
