import { useId } from 'react'
import type { Mood } from '../lib/voice'
import './Mascot.css'

/*
  The recurring character — Maya herself: long dark curly hair, warm skin,
  thick brows, and the big open-eyed grin from her own photos.

  Flat layered shapes throughout: hair is a cluster of overlapping circles
  rather than smooth wavy paths, which is what actually reads as curls at
  this size — a single bezier blob just reads as wavy. The front fringe is
  clipped to the head circle so it can't spill onto the face; the back
  volume is left unclipped and allowed to bulge past the head's edge, which
  is what gives it the fuller, rounder silhouette.
*/

const HAIR = '#2e2019'
const SKIN = '#e8b98f'
const SKIN_SHADE = '#d9a679'
const INK = '#2b2019'
const TEETH = '#fff8f0'
const TOP = '#8fa8ae'

/** A cluster of overlapping circles — the unit curly hair is built from. */
function Curls({
  spots,
  fill,
}: {
  spots: [number, number, number][]
  fill: string
}) {
  return (
    <>
      {spots.map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={fill} />
      ))}
    </>
  )
}

const BACK_VOLUME: [number, number, number][] = [
  [60, 19, 29],
  [29, 27, 21],
  [91, 27, 21],
  [16, 48, 19],
  [104, 48, 19],
  [14, 76, 17],
  [106, 76, 17],
  [19, 104, 15],
  [101, 104, 15],
  [27, 128, 13],
  [93, 128, 13],
]

const FRONT_FRINGE: [number, number, number][] = [
  [34, 27, 11],
  [48, 21, 11.5],
  [60, 19, 12],
  [72, 21, 11.5],
  [86, 27, 11],
  [26, 38, 10],
  [94, 38, 10],
]

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
      <path d="M40 39.5 Q47.5 34.5 55 38" stroke={HAIR} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M65 38 Q72.5 34.5 80 39.5" stroke={HAIR} strokeWidth="3.4" fill="none" strokeLinecap="round" />
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
  // Idle default — a full, warm smile. She's happy to see you even at rest.
  return (
    <path d="M44 61 Q60 76 76 61" stroke={INK} strokeWidth="3.2" fill="none" strokeLinecap="round" />
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

      {/* hair volume, behind everything — a curl cluster, not a smooth blob */}
      <g className="mascot__hairback">
        <Curls spots={BACK_VOLUME} fill={HAIR} />
      </g>

      {/* shoulders + top */}
      <path d="M28 118 Q60 100 92 118 L96 144 L24 144 Z" fill={TOP} />

      {/* neck */}
      <rect x="52" y="82" width="16" height="18" fill={SKIN_SHADE} />

      {/* head */}
      <circle cx="60" cy="50" r="33" fill={SKIN} />

      {/* front curls, clipped to the head so they can't spill onto the face */}
      <g clipPath={`url(#${headClip})`}>
        <Curls spots={FRONT_FRINGE} fill={HAIR} />
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
    </svg>
  )
}
