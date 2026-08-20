import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

/*
  Same send logic as send-push.ts, forked rather than shared (Vercel's
  bundler doesn't reliably follow relative imports across the api/
  folder boundary — see the comment in send-push.ts). Two differences
  on purpose:

  - No CRON_SECRET check. This is a manual test trigger, reachable from
    the app's hidden debug panel (tap the streak flame 6x), not from the
    scheduled cron job. Worst case if someone finds the URL is an
    unwanted push to her one test subscriber — no data is read or
    written beyond that, consistent with the rest of this app's
    no-auth, single-user posture.
  - Always bypasses the "already sent recently" dedup, so testing
    doesn't need to wait out a 20-hour window.
*/

type Difficulty = 'easy' | 'medium' | 'hard' | 'nightmare'
type DayStatus = 'open' | 'done' | 'frozen' | 'missed'

interface DayRecord {
  status: DayStatus
  difficulty: Difficulty | null
}

interface PlayerState {
  dayStatus: DayStatus
  dayIndex: number
  streakCurrent: number
  history: DayRecord[]
}

type NotificationTrigger = 'evening_nudge' | 'urgent_nudge'

interface PushNotification {
  trigger: NotificationTrigger
  title: string
  body: string
  icon: string
}

const APP_NAME = 'Stop Making Excuses'

const ICON_SMILING = '/notification-icon-smiling.png'
const ICON_ALARMED = '/notification-icon-alarmed.png'

const EVENING_LINES = [
  "Time to talk to boys 💬 (or girls, I don't judge)",
  "Prime texting hours. Someone's waiting to hear from you 👀",
  'Go on, say hi to someone 💌',
]

const URGENT_LINES = [
  'HURRY UP!! NO EXCUSES!',
  "🚨 Midnight's coming. Do the thing.",
  "Last call before today's gone. No excuses.",
]

function pick(list: string[], seed: number): string {
  return list[Math.abs(seed) % list.length]
}

function eveningNudge(s: PlayerState, seed: number): PushNotification | null {
  if (s.dayStatus !== 'open') return null
  return { trigger: 'evening_nudge', title: APP_NAME, body: pick(EVENING_LINES, seed), icon: ICON_SMILING }
}

function urgentNudge(s: PlayerState, seed: number): PushNotification | null {
  if (s.dayStatus !== 'open') return null
  return { trigger: 'urgent_nudge', title: APP_NAME, body: pick(URGENT_LINES, seed), icon: ICON_ALARMED }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slot = req.query.slot
  if (slot !== 'evening' && slot !== 'urgent') {
    res.status(400).json({ error: "Missing or invalid ?slot= (expected 'evening' or 'urgent')" })
    return
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY

  if (!supabaseUrl || !supabaseKey || !vapidPublic || !vapidPrivate) {
    res.status(500).json({ error: 'Missing required environment variables' })
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const [{ data: stateRow }, { data: subRow }] = await Promise.all([
    supabase.from('player_state').select('data').eq('id', 1).maybeSingle(),
    supabase.from('push_subscription').select('*').eq('id', 1).maybeSingle(),
  ])

  if (!stateRow) {
    res.status(200).json({ sent: false, reason: 'no player_state yet' })
    return
  }
  if (!subRow) {
    res.status(200).json({ sent: false, reason: 'not subscribed' })
    return
  }

  const player = stateRow.data as PlayerState
  const notification =
    slot === 'evening' ? eveningNudge(player, player.dayIndex) : urgentNudge(player, player.dayIndex)

  if (!notification) {
    res.status(200).json({ sent: false, reason: 'nothing to say right now' })
    return
  }

  webpush.setVapidDetails('mailto:noreply@example.com', vapidPublic, vapidPrivate)

  try {
    await webpush.sendNotification(
      { endpoint: subRow.endpoint, keys: { p256dh: subRow.p256dh, auth: subRow.auth } },
      JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon,
        trigger: notification.trigger,
      }),
    )
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode
    if (status === 404 || status === 410) {
      await supabase.from('push_subscription').delete().eq('id', 1)
    }
    res.status(200).json({ sent: false, error: String(err) })
    return
  }

  res.status(200).json({ sent: true, trigger: notification.trigger, body: notification.body })
}
