import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

/*
  Fully self-contained on purpose — no imports from ../src/lib. A version
  of this function that imported from src/lib/notifications crashed in
  production with FUNCTION_INVOCATION_FAILED, consistent with Vercel's Node
  bundler not following relative imports that cross the api/ folder
  boundary — api/classify.ts in the sibling shopping-list project avoids
  the same thing for the same reason. This logic must be kept in sync by
  hand with src/lib/notifications.ts's eveningNudge()/urgentNudge(); there's
  no automatic way to share it given that constraint.

  Two fixed daily check-ins, not a streak-aware pool — Maya's direction:
  copy (and icon) depends on the hour, not on state. vercel.json points two
  separate cron entries at this same function, distinguished by ?slot=.
  Neither fires if today's already done or frozen — celebration stays
  in-app, a push notification's only job is reaching her if today never
  happened.
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

// 8pm: friendly, not urgent — plenty of the evening left.
const EVENING_LINES = [
  "Time to talk to boys 💬 (or girls, I don't judge)",
  "Prime texting hours. Someone's waiting to hear from you 👀",
  'Go on, say hi to someone 💌',
]

// 10:30pm: today's nearly out of runway.
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
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

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

  const [{ data: stateRow }, { data: subRow }, { data: logRow }] = await Promise.all([
    supabase.from('player_state').select('data').eq('id', 1).maybeSingle(),
    supabase.from('push_subscription').select('*').eq('id', 1).maybeSingle(),
    supabase.from('push_log').select('*').eq('id', 1).maybeSingle(),
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
    slot === 'evening'
      ? eveningNudge(player, player.dayIndex)
      : urgentNudge(player, player.dayIndex)

  if (!notification) {
    res.status(200).json({ sent: false, reason: 'nothing to say right now' })
    return
  }

  // Same trigger as last time, sent recently — skip so this doesn't double
  // up if the cron fires twice in a short window for any reason. Bypassed
  // by ?force=1, already behind the same CRON_SECRET auth as the rest of
  // this endpoint, so a real test send (e.g. previewing an icon/copy
  // change) doesn't have to wait out a 20-hour window.
  const sentRecently =
    req.query.force !== '1' &&
    logRow?.last_trigger === notification.trigger &&
    logRow?.last_sent_at &&
    Date.now() - new Date(logRow.last_sent_at).getTime() < 20 * 60 * 60 * 1000

  if (sentRecently) {
    res.status(200).json({ sent: false, reason: 'already sent this trigger recently' })
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
      }),
    )
  } catch (err) {
    // 410/404 means the browser revoked the subscription — clear it so we
    // stop trying to push into a dead endpoint every night.
    const status = (err as { statusCode?: number }).statusCode
    if (status === 404 || status === 410) {
      await supabase.from('push_subscription').delete().eq('id', 1)
    }
    res.status(200).json({ sent: false, error: String(err) })
    return
  }

  await supabase.from('push_log').upsert({
    id: 1,
    last_trigger: notification.trigger,
    last_sent_at: new Date().toISOString(),
  })

  res.status(200).json({ sent: true, trigger: notification.trigger, body: notification.body })
}
