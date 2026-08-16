import { useId } from 'react'
import type { Mood } from '../lib/voice'
import './Mascot.css'

/*
  The recurring character — Maya herself: long dark wavy hair, warm skin,
  thick brows, and the big open-eyed grin from her own photos. Sunglasses
  pushed up on her head are the one constant accessory, an anchor for the
  silhouette the way a mascot's collar or scarf would be.

  Flat layered shapes throughout: hair is clipped into the head circle
  rather than traced around it, eyes are a circle + highlight dot with
  mood-specific overlays. Eyes stay open even when proud — the reference
  photos are bright-eyed and grinning, not squint-happy, so the mouth
  carries the excitement instead.
*/

const HAIR = '#2e2019'
const HAIR_MID = '#4a3327'
const SKIN = '#e8b98f'
const SKIN_SHADE = '#d9a679'
const INK = '#2b2019'
const TEETH = '#fff8f0'
const TOP = '#8fa8ae'
const LENS = '#1c2733'

function Eyebrows({ mood }: { mood: Mood }) {
  if (mood === 'unimpressed') {
    return (
      <>
        <path d="M40 42 Q47.5 38 55 41.5" stroke={HAIR} strokeWidth="3.6" fill="none" strokeLinecap="round" />
        <path d="M65 41.5 Q72.5 38 80 42" stroke={HAIR} strokeWidth="3.6" fill="none" strokeLinecap="round" />
      </>
    )
  }
  if (mood === 'smug') {
    return (
      <>
        <path d="M40 39 Q47.5 32.5 55 37" stroke={HAIR} strokeWidth="3.6" fill="none" strokeLinecap="round" />
        <path d="M65 40.5 Q72.5 37.5 80 40.5" stroke={HAIR} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      </>
    )
  }
  if (mood === 'proud') {
    return (
      <>
        <path d="M40 38 Q47.5 32 55 36.5" stroke={HAIR} strokeWidth="3.6" fill="none" strokeLinecap="round" />
        <path d="M65 36.5 Q72.5 32 80 38" stroke={HAIR} strokeWidth="3.6" fill="none" strokeLinecap="round" />
      </>
    )
  }
  return (
    <>
      <path d="M40 40 Q47.5 35.5 55 38.5" stroke={HAIR} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M65 38.5 Q72.5 35.5 80 40" stroke={HAIR} strokeWidth="3.4" fill="none" strokeLinecap="round" />
    </>
  )
}

function Eyes({ mood }: { mood: Mood }) {
  const bright = mood === 'proud'
  return (
    <>
      <circle cx="47.5" cy="48" r={bright ? 6.6 : 6} fill={INK} />
      <circle cx="72.5" cy="48" r={bright ? 6.6 : 6} fill={INK} />
      <circle cx="49.6" cy="45.4" r="2.2" fill="#fff" />
      <circle cx="74.6" cy="45.4" r="2.2" fill="#fff" />
      {mood === 'unimpressed' && (
        <>
          <path d="M40 44 Q47.5 40 55 44" stroke={SKIN} strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M65 44 Q72.5 40 80 44" stroke={SKIN} strokeWidth="7" fill="none" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

function Mouth({ mood }: { mood: Mood }) {
  if (mood === 'proud') {
    return (
      <>
        <path d="M45 62 Q60 78 75 62 Q60 70 45 62 Z" fill={INK} />
        <path d="M48.5 63 Q60 71 71.5 63 Q60 67.5 48.5 63 Z" fill={TEETH} />
      </>
    )
  }
  if (mood === 'smug') {
    return (
      <path d="M46 63 Q58 68 74 60" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
    )
  }
  if (mood === 'unimpressed') {
    return <path d="M47 65 Q60 62 73 65" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
  }
  return (
    <path d="M46 62 Q60 71 74 62" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
  )
}

export function Mascot({ mood = 'idle', size = 76 }: { mood?: Mood; size?: number }) {
  const uid = useId().replace(/:/g, '')
  const headClip = `mc-head-${uid}`

  return (
    <svg
      className="mascot"
      data-mood={mood}
      width={size}
      height={size * 1.2}
      viewBox="0 0 120 144"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={headClip}>
          <circle cx="60" cy="50" r="33" />
        </clipPath>
      </defs>

      {/* hair volume, behind everything — curly and past the shoulders */}
      <g className="mascot__hairback">
        <path
          d="M20 66 Q12 100 22 138 L34 138 Q26 104 33 72 Z"
          fill={HAIR}
        />
        <path
          d="M100 66 Q108 100 98 138 L86 138 Q94 104 87 72 Z"
          fill={HAIR}
        />
        <ellipse cx="60" cy="34" rx="36" ry="30" fill={HAIR} />
      </g>

      {/* shoulders + top */}
      <path d="M28 118 Q60 100 92 118 L96 144 L24 144 Z" fill={TOP} />

      {/* neck */}
      <rect x="52" y="82" width="16" height="18" fill={SKIN_SHADE} />

      {/* head */}
      <circle cx="60" cy="50" r="33" fill={SKIN} />

      {/* front hair, clipped to the head so it can't drift past the edge */}
      <g clipPath={`url(#${headClip})`}>
        <path
          d="M22 44 Q26 8 60 8 Q94 8 98 44 Q94 26 84 24 Q88 40 82 52 Q78 30 66 24 Q70 38 62 40 Q58 26 46 26 Q50 38 40 44 Q36 28 26 30 Q30 40 22 44 Z"
          fill={HAIR}
        />
        <path d="M22 44 Q26 8 60 8 Q94 8 98 44 Q80 22 60 22 Q40 22 22 44 Z" fill={HAIR_MID} opacity="0.5" />
      </g>

      {/* ears + small gold hoops */}
      <circle cx="27" cy="54" r="5" fill={SKIN} />
      <circle cx="93" cy="54" r="5" fill={SKIN} />
      <circle cx="27" cy="60" r="2.6" fill="none" stroke="var(--gold)" strokeWidth="1.6" />
      <circle cx="93" cy="60" r="2.6" fill="none" stroke="var(--gold)" strokeWidth="1.6" />

      <Eyebrows mood={mood} />
      <Eyes mood={mood} />
      <path d="M59 50 L57.5 58 Q60 59.5 62.5 58" stroke={SKIN_SHADE} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Mouth mood={mood} />

      {/* signature sunglasses, pushed up on top of the hair */}
      <g className="mascot__shades">
        <rect x="30" y="14" width="24" height="16" rx="8" fill={LENS} />
        <rect x="66" y="14" width="24" height="16" rx="8" fill={LENS} />
        <rect x="54" y="19" width="12" height="4" rx="2" fill={LENS} />
        <path d="M35 19 Q40 17 46 19" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  )
}
