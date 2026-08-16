import { useId } from 'react'
import type { Mood } from '../lib/voice'
import './Doggo.css'

/*
  The mascot: a sitting shepherd matching the reference art — tan coat, dark
  cap over the top of the head, cream muzzle and chest, purple collar, tongue
  out. Four moods. She appears next to the live step and says one thing.

  The cap and the tongue are drawn by clipping into a shape rather than by
  tracing outlines, so they can't drift when the geometry moves. The eyes sit
  deliberately below the cap's edge — any higher and they vanish into it.
*/

const COAT = '#dda75f'
const DARK = '#5f4430'
const CREAM = '#f7e8d0'
const INK = '#2e2119'
const TONGUE = '#ec7d92'
const COLLAR = '#9b7fd4'
const TAG = '#ffc93c'

function Eyes({ mood }: { mood: Mood }) {
  if (mood === 'proud') {
    return (
      <>
        <path d="M40 43 Q47 35 54 43" stroke={INK} strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <path d="M66 43 Q73 35 80 43" stroke={INK} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      </>
    )
  }

  const smug = mood === 'smug'
  const down = mood === 'unimpressed'

  return (
    <>
      <circle cx="47" cy="41" r="6" fill={INK} />
      <circle cx="73" cy="41" r="6" fill={INK} />
      <circle cx={smug ? 49.4 : 48.9} cy="38.6" r="2.1" fill="#fff" />
      <circle cx={smug ? 75.4 : 74.9} cy="38.6" r="2.1" fill="#fff" />

      {/* heavy lids do all the acting */}
      {down && (
        <>
          <path d="M40 40 Q47 35.5 54 40" stroke={DARK} strokeWidth="6.5" fill="none" strokeLinecap="round" />
          <path d="M66 40 Q73 35.5 80 40" stroke={DARK} strokeWidth="6.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {smug && (
        <path d="M40 37.5 Q47 33 54 37.5" stroke={DARK} strokeWidth="5.6" fill="none" strokeLinecap="round" />
      )}
    </>
  )
}

export function Doggo({ mood = 'idle', size = 76 }: { mood?: Mood; size?: number }) {
  const uid = useId().replace(/:/g, '')
  const headClip = `dg-head-${uid}`
  const mouthClip = `dg-mouth-${uid}`
  const smiling = mood !== 'unimpressed'

  return (
    <svg
      className="doggo"
      data-mood={mood}
      width={size}
      height={size * 1.12}
      viewBox="0 0 120 134"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={headClip}>
          <circle cx="60" cy="42" r="30" />
        </clipPath>
        <clipPath id={mouthClip}>
          <path d="M48 57 Q60 71 72 57 Z" />
        </clipPath>
      </defs>

      {/* tail — short and low, tucked beside the haunch */}
      <path
        className="doggo__tail"
        d="M84 108 Q102 106 100 94 Q99 88 93 90"
        stroke={COAT}
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />

      <g className="doggo__body">
        <ellipse cx="60" cy="100" rx="31" ry="27" fill={COAT} />
        <ellipse cx="60" cy="102" rx="15" ry="16" fill={CREAM} />
        {/* front legs sit on top of the chest so they stay readable */}
        <rect x="43" y="100" width="13" height="27" rx="6.5" fill={COAT} />
        <rect x="64" y="100" width="13" height="27" rx="6.5" fill={COAT} />
        <ellipse cx="49.5" cy="125" rx="8" ry="5" fill={CREAM} />
        <ellipse cx="70.5" cy="125" rx="8" ry="5" fill={CREAM} />

        {/* collar — wider than the head so it reads as a band, not a bowtie */}
        <rect x="36" y="70" width="48" height="13" rx="6.5" fill={COLLAR} />
        <circle cx="60" cy="88" r="4.5" fill={TAG} />
      </g>

      {/* ears */}
      <g className="doggo__ear doggo__ear--l">
        <path d="M42 26 L29 2 L57 18 Z" fill={DARK} />
        <path d="M43 24 L35 10 L52 19 Z" fill={COAT} />
      </g>
      <g className="doggo__ear doggo__ear--r">
        <path d="M78 26 L91 2 L63 18 Z" fill={DARK} />
        <path d="M77 24 L85 10 L68 19 Z" fill={COAT} />
      </g>

      {/* head, with the dark cap clipped inside it */}
      <circle cx="60" cy="42" r="30" fill={COAT} />
      <g clipPath={`url(#${headClip})`}>
        <rect x="28" y="8" width="64" height="32" fill={DARK} />
        <ellipse cx="60" cy="50" rx="28" ry="22" fill={COAT} />
      </g>

      {/* muzzle */}
      <ellipse cx="60" cy="57" rx="18" ry="12.5" fill={CREAM} />
      {smiling ? (
        <>
          <path d="M48 57 Q60 71 72 57 Z" fill={INK} />
          <g clipPath={`url(#${mouthClip})`}>
            <ellipse cx="60" cy="67" rx="7" ry="6" fill={TONGUE} />
          </g>
        </>
      ) : (
        <path d="M51 62 H69" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      )}
      <ellipse cx="60" cy="50" rx="6" ry="4.5" fill={INK} />

      <Eyes mood={mood} />
    </svg>
  )
}
