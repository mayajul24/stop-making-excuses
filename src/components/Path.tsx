import { useEffect, useRef } from 'react'
import type { PathNode } from '../lib/path'
import type { Mood } from '../lib/voice'
import { Mascot } from './Mascot'
import './Path.css'

/*
  The winding journey. Nodes snake left and right down the page with a dotted
  trail between them; Maya stands next to whichever step is live and says
  one thing. Everything below the current step is dimmed but visible, so she
  can always see what's coming.
*/

/** Horizontal snake. Repeats every 8 nodes. */
const SNAKE = [0, 46, 72, 46, 0, -46, -72, -46]

// Faint background glyphs scattered along the path — Duolingo does this
// with grey lesson-type icons; ours are themed to the app instead.
// Deterministic from node position (not random) so they don't reshuffle
// on re-render.
const DECOR_GLYPHS = ['💬', '✨', '💌', '☕', '👠']

// Future nodes used to all be identical blank dimmed grey circles — the
// reference has them in bright, varied colors, not muted. Each glyph gets
// its own color from the app's existing palette rather than all sharing
// one, matching that variety.
const FUTURE_STYLES: { glyph: string; bg: string; border: string }[] = [
  { glyph: '☕', bg: 'var(--orange)', border: 'var(--orange-deep)' },
  { glyph: '❤️', bg: 'var(--rose)', border: 'var(--rose-deep)' },
  { glyph: '💀', bg: 'var(--lilac)', border: 'var(--lilac-deep)' },
  { glyph: '😰', bg: 'var(--blue)', border: 'var(--blue-deep)' },
  { glyph: '💬', bg: 'var(--gold)', border: 'var(--gold-deep)' },
  { glyph: '✨', bg: 'var(--green)', border: 'var(--green-deep)' },
]

const GLYPH: Record<PathNode['kind'], string> = {
  done: '✓',
  milestone: '🎁',
  frozen: '❄️',
  missed: '·',
  current: '👣',
  future: '',
}

export function Path({
  nodes,
  mascotLine,
  mascotMood,
  onLiveNodeClick,
}: {
  nodes: PathNode[]
  mascotLine: string
  mascotMood: Mood
  /** Tapping the live step's circle, matching the reference — the mission
   *  card doesn't just sit there, she has to tap the node to bring it up. */
  onLiveNodeClick?: () => void
}) {
  const liveStep = useRef<HTMLDivElement>(null)

  // The journey is meant to be long, so the page opens parked on the live
  // step rather than at week one — otherwise there is nothing to act on.
  useEffect(() => {
    liveStep.current?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div className="path">
      {nodes.map((node, i) => {
        const offset = SNAKE[i % SNAKE.length]
        const next = nodes[i + 1]
        const midOffset = next
          ? (offset + SNAKE[(i + 1) % SNAKE.length]) / 2
          : 0

        // Every 4th step gets a faint glyph on the side the path isn't
        // leaning toward, so it never sits under the node itself. Skipped
        // on the live/milestone nodes so those stay visually clean.
        const showDecor = node.kind !== 'current' && node.kind !== 'milestone' && i % 4 === 2
        const futureStyle = node.kind === 'future' ? FUTURE_STYLES[i % FUTURE_STYLES.length] : null
        const glyph = futureStyle ? futureStyle.glyph : GLYPH[node.kind]

        return (
          <div
            className="path__step"
            key={node.key}
            ref={node.isLive ? liveStep : undefined}
          >
            <div
              className="path__slot"
              style={{ transform: `translateX(${offset}px)` }}
            >
              <div
                className="path__node"
                data-kind={node.kind}
                onClick={node.isLive ? onLiveNodeClick : undefined}
                role={node.isLive && onLiveNodeClick ? 'button' : undefined}
                style={
                  futureStyle
                    ? { background: futureStyle.bg, borderColor: futureStyle.border }
                    : undefined
                }
              >
                <span className="path__glyph">{glyph}</span>
              </div>

              <div className="path__label" data-kind={node.kind}>
                {node.label}
              </div>

              {node.stars > 0 && (
                <div className="path__stars">{'★'.repeat(node.stars)}</div>
              )}

              {node.isLive && (
                <div
                  className="path__mascot"
                  data-side={offset > 0 ? 'left' : 'right'}
                >
                  <Mascot mood={mascotMood} size={115} />
                  <div className="path__bubble">{mascotLine}</div>
                </div>
              )}

              {showDecor && (
                <span
                  className="path__decor"
                  style={{ transform: `translateX(${offset >= 0 ? -68 : 68}px)` }}
                  aria-hidden="true"
                >
                  {DECOR_GLYPHS[Math.floor(i / 4) % DECOR_GLYPHS.length]}
                </span>
              )}
            </div>

            {next && (
              <div
                className="path__trail"
                style={{ transform: `translateX(${midOffset}px)` }}
                aria-hidden="true"
              >
                <i />
                <i />
                <i />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
