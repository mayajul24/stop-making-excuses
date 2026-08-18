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
  hand with src/lib/notifications.ts's eveningReminder(); there's no
  automatic way to share it given that constraint.

  Reminders only, evening-only — no celebration push. Maya was explicit:
  encourage her in-app, after she's already done something; a push
  notification's only job is reaching her if today never happened.
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

type NotificationTrigger = 'reminder_streak' | 'reminder_fresh' | 'reminder_dry_spell'

interface PushNotification {
  trigger: NotificationTrigger
  title: string
  body: string
}

const APP_NAME = 'Stop Making Excuses'

const REMINDER_STREAK = [
  '🚨 Your streak dies at midnight. Just saying.',
  "Don't break the streak. You've got a few hours 😈",
  'Streak on the line. No pressure, but also — pressure.',
]
const REMINDER_FRESH = [
  "👀 Today's still open if you want it.",
  'One small thing, whenever tonight works.',
  'No streak to protect, no reason not to.',
]
const REMINDER_DRY_SPELL = [
  "It's been a while. Still here whenever you're ready.",
  'No rush. The app remembers you exist though.',
]

function pick(list: string[], seed: number): string {
  return list[Math.abs(seed) % list.length]
}

function notif(trigger: NotificationTrigger, body: string): PushNotification {
  return { trigger, title: APP_NAME, body }
}

function eveningReminder(s: PlayerState, seed: number): PushNotification | null {
  if (s.dayStatus !== 'open') return null

  const trailing = s.history.slice(-7)
  const longDrySpell = trailing.length === 7 && trailing.every((d) => d.status === 'missed')

  if (longDrySpell) return notif('reminder_dry_spell', pick(REMINDER_DRY_SPELL, seed))
  if (s.streakCurrent >= 1) return notif('reminder_streak', pick(REMINDER_STREAK, seed))
  return notif('reminder_fresh', pick(REMINDER_FRESH, seed))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' })
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
  const notification = eveningReminder(player, player.dayIndex)

  if (!notification) {
    res.status(200).json({ sent: false, reason: 'nothing to say right now' })
    return
  }

  // Same trigger as last time, sent recently — skip so this doesn't double
  // up if the cron fires twice in a short window for any reason.
  const sentRecently =
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
      JSON.stringify({ title: notification.title, body: notification.body }),
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
