import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { nextPushNotification } from '../src/lib/notifications'
import { daysIntoWeek } from '../src/lib/calendar'
import type { PlayerState } from '../src/types'

// Vercel Cron hits this on a schedule (see vercel.json). Reusing the same
// VITE_-prefixed vars the browser client uses is intentional — Vite strips
// that prefix requirement only for client bundling; a Node function can
// read any env var regardless of name. One fewer secret to manage.
//
// If this file fails to build because Vercel's bundler won't follow the
// ../src/lib imports above, the fix is to inline nextPushNotification's
// logic directly in this file instead — api/classify.ts in the sibling
// shopping-list project avoids cross-boundary imports for exactly this
// reason, so it's a known Vercel quirk, not a hypothetical one.
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
  const notification = nextPushNotification(
    player,
    daysIntoWeek(),
    player.weekIndex,
  )

  if (!notification) {
    res.status(200).json({ sent: false, reason: 'nothing to say right now' })
    return
  }

  // Same trigger as last time, sent recently — skip so a streak-dying
  // warning that stays true for two days doesn't fire twice.
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
      {
        endpoint: subRow.endpoint,
        keys: { p256dh: subRow.p256dh, auth: subRow.auth },
      },
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
