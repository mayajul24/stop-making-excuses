import { useState } from 'react'
import './DebugPanel.css'

/*
  Hidden test menu — opened by tapping the streak flame 6x within 1.5s
  (see Home.tsx), not linked from anywhere visible. Lets her preview the
  streak celebration and fire either push notification on demand instead
  of asking for a manual trigger every time, or waiting for the real
  daily state (already-done, or the 20h dedup window) to allow it.
*/

export function DebugPanel({
  streak,
  onPreviewStreak,
  onClose,
}: {
  streak: number
  onPreviewStreak: () => void
  onClose: () => void
}) {
  const [status, setStatus] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function sendPush(slot: 'evening' | 'urgent') {
    setSending(true)
    setStatus('Sending…')
    try {
      const res = await fetch(`/api/debug-send-push?slot=${slot}`)
      const data = await res.json()
      setStatus(data.sent ? 'Sent — check your tray ✓' : `Not sent: ${data.reason ?? data.error ?? 'unknown'}`)
    } catch {
      setStatus('Request failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="debugpanel__backdrop" onClick={onClose}>
      <div className="debugpanel" onClick={(e) => e.stopPropagation()}>
        <span className="debugpanel__title">🛠 Debug menu</span>

        <button
          className="debugpanel__btn"
          onClick={() => {
            onPreviewStreak()
            onClose()
          }}
        >
          🎉 Preview streak celebration ({streak})
        </button>

        <button className="debugpanel__btn" disabled={sending} onClick={() => sendPush('evening')}>
          📨 Send evening notification
        </button>

        <button className="debugpanel__btn" disabled={sending} onClick={() => sendPush('urgent')}>
          🚨 Send urgent notification
        </button>

        {status && <span className="debugpanel__status">{status}</span>}

        <button className="debugpanel__close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
