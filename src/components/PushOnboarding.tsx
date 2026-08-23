import { useEffect, useState } from 'react'
import { checkPushStatus, subscribeToPush } from '../lib/push'
import { Mascot } from './Mascot'
import './PushOnboarding.css'

const SEEN_KEY = 'stami:push-onboarded'

/*
  Shown once, on her very first open, before she's touched anything else —
  not a "Turn on" button buried on the Progress tab waiting to be found.
  Whatever she picks (enable or not now), it's marked seen and never shown
  again automatically; changing her mind later happens through the toggle
  on Progress, which stays regardless.
*/
export function PushOnboarding() {
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (localStorage.getItem(SEEN_KEY)) return
    checkPushStatus().then((status) => {
      // Only worth asking if there's something to ask for and no answer
      // already exists — unsupported/denied/already-on all skip straight
      // to "seen" so this can't loop back on her.
      if (status === 'off') setVisible(true)
      else localStorage.setItem(SEEN_KEY, '1')
    })
  }, [])

  function dismiss() {
    localStorage.setItem(SEEN_KEY, '1')
    setVisible(false)
  }

  async function enable() {
    setBusy(true)
    setError(null)
    try {
      await subscribeToPush()
      dismiss()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  if (!visible) return null

  return (
    <div className="pushonboard">
      <div className="pushonboard__card rise">
        <Mascot mood="idle" size={130} />
        <h2 className="pushonboard__title">Want a nudge?</h2>
        <p className="pushonboard__body">
          Turn on notifications and I'll check in when you need a nudge. You
          can turn this off any time from Progress.
        </p>
        {error && <p className="pushonboard__error">{error}</p>}
        <button className="pushonboard__enable" onClick={enable} disabled={busy}>
          {busy ? 'One sec…' : 'Enable notifications'}
        </button>
        <button className="pushonboard__skip" onClick={dismiss} disabled={busy}>
          Not now
        </button>
      </div>
    </div>
  )
}
