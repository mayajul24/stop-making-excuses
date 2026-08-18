/*
  Matches the reference Maya sent twice: a rounded flame/drop shape with a
  notch bitten out of the top-right, a lighter inner drop, sitting on a
  flattened oval base. Duolingo's own icon shifts between a lit (colored)
  and unlit (grey) state depending on whether the streak is actually
  alive — replicated here off streakCurrent rather than treating it as
  permanently "on".
*/
export function StreakFlame({ lit, size = 22 }: { lit: boolean; size?: number }) {
  const body = lit ? 'var(--orange)' : 'var(--card-edge)'
  const inner = lit ? 'var(--gold-deep)' : 'var(--text-faint)'
  const drop = lit ? '#fff8ec' : 'var(--card-sunk)'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 34"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="16" cy="30.5" rx="9" ry="2.4" fill={body} opacity="0.35" />
      <path
        d="M16 2
           C10 8 7 13.5 7 19
           A9 9 0 0 0 25 19
           C25 15.5 23.4 13 21.6 11.4
           C21.9 13.2 21 14.6 19.7 14.6
           C20.6 10.6 19 5.8 16 2 Z"
        fill={body}
      />
      <path
        d="M16 12
           C13.3 15.4 12 18 12 20.3
           A4.3 4.3 0 0 0 20.3 20.3
           C20.3 17.7 18.7 14.9 16 12 Z"
        fill={drop}
      />
      <circle cx="19.6" cy="12.2" r="1.4" fill={inner} />
    </svg>
  )
}
