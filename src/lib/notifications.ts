import type { PlayerState } from '../types'

/*
  What a real push notification system would send, and when — content and
  trigger logic only. Actually delivering these to her phone needs a
  backend: something to hold her subscription and fire on a schedule even
  when the app isn't open (see api/send-push.ts).

  Reminders only, evening-only, matching Maya's explicit direction: "the
  nice 'holly shit you did it' notifications are not needed. we should
  encourage her AFTER she did the challenge" — celebration happens in-app
  (see voice.ts's 'done' banner), where she's actually looking at it. A
  push notification's only job here is the thing an in-app banner can't
  do: reach her at 9pm if today never happened.
*/

export type NotificationTrigger = 'reminder_streak' | 'reminder_fresh' | 'reminder_dry_spell'

export interface PushNotification {
  trigger: NotificationTrigger
  title: string
  body: string
}

const APP_NAME = 'Stop Making Excuses'

// She has an active streak and hasn't done today's yet — protect it.
const REMINDER_STREAK = [
  '🚨 Your streak dies at midnight. Just saying.',
  "Don't break the streak. You've got a few hours 😈",
  'Streak on the line. No pressure, but also — pressure.',
]

// No streak riding on it — a plain, low-stakes nudge.
const REMINDER_FRESH = [
  "👀 Today's still open if you want it.",
  'One small thing, whenever tonight works.',
  'No streak to protect, no reason not to.',
]

// A real dry spell — gentle, not guilt-tripping.
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

/**
 * Called once, in the evening (see vercel.json's cron schedule). Returns
 * null when there's nothing to send — she already did today's, she's
 * using a freeze on purpose, or nothing's wrong enough to interrupt her
 * for.
 */
export function eveningReminder(s: PlayerState, seed: number): PushNotification | null {
  if (s.dayStatus !== 'open') return null // done or frozen — nothing to nag about

  const trailing = s.history.slice(-7)
  const longDrySpell = trailing.length === 7 && trailing.every((d) => d.status === 'missed')

  if (longDrySpell) return notif('reminder_dry_spell', pick(REMINDER_DRY_SPELL, seed))
  if (s.streakCurrent >= 1) return notif('reminder_streak', pick(REMINDER_STREAK, seed))
  return notif('reminder_fresh', pick(REMINDER_FRESH, seed))
}
