import { COURAGE_MAX } from '../lib/game'
import './Courage.css'

/*
  Courage is drawn, not emoji'd — a 💗 glyph would drop a foreign visual
  language into the middle of the type. Filled = available, hairline = spent.
*/

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      className="courage__heart"
      data-filled={filled}
      width="13"
      height="12"
      viewBox="0 0 14 13"
      aria-hidden="true"
    >
      <path
        d="M7 12.2 1.9 7.1A3.4 3.4 0 0 1 7 2.6a3.4 3.4 0 0 1 5.1 4.5Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  )
}

export function Courage({ value, cost }: { value: number; cost?: number }) {
  return (
    <div className="courage">
      <span className="courage__label">Courage</span>
      <span className="courage__row">
        {Array.from({ length: COURAGE_MAX }, (_, i) => (
          <Heart key={i} filled={i < value} />
        ))}
      </span>
      {cost !== undefined && (
        <span className="courage__cost">−{cost} this week</span>
      )}
    </div>
  )
}
