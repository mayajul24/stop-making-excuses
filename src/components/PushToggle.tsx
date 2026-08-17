import { useEffect, useState } from 'react'
import {
  checkPushStatus,
  subscribeToPush,
  unsubscribeFromPush,
  type PushStatus,
} from '../lib/push'
import './PushToggle.css'

const COPY: Record<PushStatus, string> = {
  unsupported: "This browser can't do push notifications.",
  unconfigured: 'Push isn’t wired up yet.',
  denied: 'You blocked notifications — turn them on in your browser settings.',
  off: 'Notifications are off.',
  on: 'Notifications are on. Consider yourself warned.',
}

/** The opt-in switch that actually puts a subscription in front of the cron job. */
export function PushToggle() {
  const [status, setStatus] = useState<PushStatus | 'checking'>('checking')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkPushStatus().then(setStatus)
  }, [])

  async function toggle() {
    setBusy(true)
    setError(null)
    try {
      if (status === 'on') {
        await unsubscribeFromPush()
        setStatus('off')
      } else {
        await subscribeToPush()
        setStatus('on')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const canToggle = status === 'on' || status === 'off'

  return (
    <div className="pushtoggle">
      <div className="pushtoggle__row">
        <span className="pushtoggle__label">
          {COPY[status === 'checking' ? 'off' : status]}
        </span>
        {canToggle && (
          <button className="pushtoggle__btn" onClick={toggle} disabled={busy}>
            {status === 'on' ? 'Turn off' : 'Turn on'}
          </button>
        )}
      </div>
      {error && <span className="pushtoggle__error">{error}</span>}
    </div>
  )
}
