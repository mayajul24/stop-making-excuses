import type { Mood } from '../lib/voice'
import './Doggo.css'

/*
  The mascot. A shepherd-ish dog, drawn in filled shapes so she reads as a
  character rather than an icon. Four moods; she is meant to show up next to
  the active step on the path and say one thing, not follow you around.
*/

const COAT = '#dda45c'
const COAT_DARK = '#6f4c30'
const CREAM = '#f7e7cd'
const NOSE = '#3a2a22'
const TONGUE = '#ef7185'

function Face({ mood }: { mood: Mood }) {
  const happy = mood === 'proud'
  const down = mood === 'unimpressed'
  const smug = mood === 'smug'

  return (
    <>
      {/* muzzle */}
      <ellipse cx="55" cy="60" rx="15.5" ry="11.5" fill={CREAM} />
      <ellipse cx="55" cy="53.5" rx="5.2" ry="4" fill={NOSE} />
      <path
        d="M55 57 Q55 64.5 48.5 64.5"
        stroke={NOSE}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={happy ? 'M55 57 Q55 68 63 66' : 'M55 57 Q55 64.5 61.5 64.5'}
        stroke={NOSE}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {happy && <ellipse cx="57" cy="69" rx="4.6" ry="5.4" fill={TONGUE} />}

      {/* eyes */}
      {happy ? (
        <>
          <path d="M39 45 Q44.5 39 50 45" stroke={NOSE} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M60 45 Q65.5 39 71 45" stroke={NOSE} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="44.5" cy="45" r="5" fill={NOSE} />
          <circle cx="65.5" cy="45" r="5" fill={NOSE} />
          <circle cx={smug ? 46.6 : 46.3} cy="43" r="1.8" fill="#fff" />
          <circle cx={smug ? 67.6 : 67.3} cy="43" r="1.8" fill="#fff" />
          {down && (
            <>
              <path d="M39 43 Q44.5 40.5 50 43" stroke={COAT_DARK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
              <path d="M60 43 Q65.5 40.5 71 43" stroke={COAT_DARK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
            </>
          )}
        </>
      )}

      {/* brows — the whole personality lives here */}
      {down && (
        <>
          <path d="M37 35 Q44 32 51 35.5" stroke={COAT_DARK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M73 35 Q66 32 59 35.5" stroke={COAT_DARK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      )}
      {smug && (
        <path d="M37 34 Q44 30 51 34.5" stroke={COAT_DARK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      )}
    </>
  )
}

export function Doggo({ mood = 'idle', size = 76 }: { mood?: Mood; size?: number }) {
  return (
    <svg
      className="doggo"
      data-mood={mood}
      width={size}
      height={size * 0.95}
      viewBox="0 0 110 104"
      aria-hidden="true"
    >
      {/* tail */}
      <path
        className="doggo__tail"
        d="M79 86 Q95 82 92 68"
        stroke={COAT}
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />

      {/* body */}
      <ellipse cx="55" cy="88" rx="25" ry="15" fill={COAT} />
      <ellipse cx="55" cy="93" rx="13.5" ry="10" fill={CREAM} />

      {/* ears */}
      <g className="doggo__ear doggo__ear--l">
        <path d="M37 32 L28 6 L50 23 Z" fill={COAT} />
        <path d="M37.5 29 L33 14 L45.5 24 Z" fill={COAT_DARK} />
      </g>
      <g className="doggo__ear doggo__ear--r">
        <path d="M73 32 L82 6 L60 23 Z" fill={COAT} />
        <path d="M72.5 29 L77 14 L64.5 24 Z" fill={COAT_DARK} />
      </g>

      {/* head */}
      <circle cx="55" cy="48" r="26" fill={COAT} />
      <path d="M29.6 42 A26 26 0 0 1 80.4 42 Q55 31 29.6 42 Z" fill={COAT_DARK} />

      <Face mood={mood} />
    </svg>
  )
}
