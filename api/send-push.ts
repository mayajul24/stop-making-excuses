import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

/*
  Fully self-contained on purpose — no imports from ../src/lib. An earlier
  version imported nextPushNotification() and daysIntoWeek() from there and
  the deployed function crashed with FUNCTION_INVOCATION_FAILED before even
  reaching its own error handling, which is consistent with Vercel's Node
  bundler not following relative imports that cross the api/ folder
  boundary — api/classify.ts in the sibling shopping-list project avoids
  the same thing for the same reason. The notification trigger logic below
  must be kept in sync by hand with src/lib/notifications.ts; there's no
  automatic way to share it given that constraint.
*/

type Difficulty = 'easy' | 'medium' | 'hard' | 'nightmare'
type WeekStatus = 'open' | 'done' | 'frozen' | 'missed'

interface WeekRecord {
  status: WeekStatus
  difficulty: Difficulty | null
}

interface PlayerState {
  weekStatus: WeekStatus
  weekIndex: number
  streakCurrent: number
  courage: number
  history: WeekRecord[]
}

const COURAGE_MAX = 3

type NotificationTrigger =
  | 'streak_dying'
  | 'inactivity_mild'
  | 'inactivity_severe'
  | 'villain_arc'
  | 'week_complete'
  | 'courage_full'
  | 'new_week'

interface PushNotification {
  trigger: NotificationTrigger
  title: string
  body: string
}

const APP_NAME = 'Stop Making Excuses'

const STREAK_DYING = [
  '🚨 Your dating streak is about to die.',
  "Your streak doesn't care about your excuses 😂",
  "Don't break the streak. Just saying 😈",
  'Hours left. The streak is watching you not open this app.',
]
const INACTIVITY_MILD = [
  "👀 It's been 3 days. We both know you're not 'just busy'.",
  'Your weekly thing is still sitting there. Unopened. Judging you.',
  'Three days of silence. Bold strategy.',
  "Just a nudge — this week's still wide open.",
]
const INACTIVITY_SEVERE = [
  "Okay queen, we're not finding anyone from the couch 😂",
  "It's been a week. The app remembers. I remember.",
  "Streak's basically a ghost at this point. Bring it back?",
  'This is the part where you prove me wrong.',
]
const VILLAIN_ARC = [
  'You spent 3 weeks saying "maybe next week". This is your villain origin story.',
  "Three weeks. Even I'm judging a little. Come back?",
  'Okay, the plot needs you to show up now.',
]
const WEEK_COMPLETE = [
  'HOLY SHIT YOU ACTUALLY DID IT 🎉',
  'She did the thing. Screenshotting this for the group chat.',
  'Maya has been notified. She is losing it 👀',
]
const COURAGE_FULL = [
  'Your Courage is fully charged and just sitting there 👀',
  'Full Courage bar. What are we waiting for?',
]
const NEW_WEEK = ['New week. New chance to be brave 🐣', "Clean slate. Let's go."]

function pick(list: string[], seed: number): string {
  return list[Math.abs(seed) % list.length]
}

function notif(trigger: NotificationTrigger, body: string): PushNotification {
  return { trigger, title: APP_NAME, body }
}

function nextPushNotification(
  s: PlayerState,
  daysIn: number,
  seed: number,
): PushNotification | null {
  if (s.weekStatus === 'done') return notif('week_complete', pick(WEEK_COMPLETE, seed))
  if (s.weekStatus === 'frozen') return null

  const trailing = s.history.slice(-3)
  if (trailing.length === 3 && trailing.every((w) => w.status === 'missed')) {
    return notif('villain_arc', pick(VILLAIN_ARC, seed))
  }
  if (s.streakCurrent >= 1 && daysIn >= 6) {
    return notif('streak_dying', pick(STREAK_DYING, seed))
  }
  if (daysIn >= 6) return notif('inactivity_severe', pick(INACTIVITY_SEVERE, seed))
  if (daysIn >= 3) return notif('inactivity_mild', pick(INACTIVITY_MILD, seed))
  if (daysIn === 0) return notif('new_week', pick(NEW_WEEK, seed))
  if (s.courage >= COURAGE_MAX) return notif('courage_full', pick(COURAGE_FULL, seed))
  return null
}

const MS_DAY = 24 * 60 * 60 * 1000
const MS_WEEK = 7 * MS_DAY
const EPOCH = new Date('2024-01-01T00:00:00Z').getTime()

function daysIntoWeek(now: number = Date.now()): number {
  return Math.floor(((now - EPOCH) % MS_WEEK) / MS_DAY)
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
  const notification = nextPushNotification(player, daysIntoWeek(), player.weekIndex)

  if (!notification) {
    res.status(200).json({ sent: false, reason: 'nothing to say right now' })
    return
  }

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
