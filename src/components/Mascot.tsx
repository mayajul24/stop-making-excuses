import type { Mood } from '../lib/voice'
import './Mascot.css'

/*
  Replaced the hand-built SVG (circle-cluster hair, 4 mood-specific face
  variants) with the illustration Maya sent directly — this is that image,
  background removed, saved as public/mascot.png.

  There's only the one static image, no separate art per mood, so `mood`
  no longer changes her expression. It still drives the CSS motion below
  (a small proud-bounce, an idle/smug sway) since that's cheap to keep and
  still reads as "alive" even off a flat image — but if a future mood
  needs an actually different face, that means new source art, not code.
*/

const ASPECT = 333 / 300 // public/mascot.png's natural height/width

export function Mascot({ mood = 'idle', size = 76 }: { mood?: Mood; size?: number }) {
  return (
    <img
      className="mascot"
      data-mood={mood}
      src="/mascot.png"
      alt=""
      width={size}
      height={Math.round(size * ASPECT)}
      draggable={false}
    />
  )
}
