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
}: {
  nodes: PathNode[]
  mascotLine: string
  mascotMood: Mood
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
              <div className="path__node" data-kind={node.kind}>
                <span className="path__glyph">{GLYPH[node.kind]}</span>
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
                  <Mascot mood={mascotMood} size={72} />
                  <div className="path__bubble">{mascotLine}</div>
                </div>
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
