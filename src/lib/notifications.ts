import type { PlayerState } from '../types'

/*
  What a real push notification system would send, and when — content and
  trigger logic only. Actually delivering these to her phone needs a
  backend: something to hold her subscription and fire on a schedule even
  when the app isn't open (see api/send-push.ts).

  Two fixed daily check-ins, not a streak-aware pool — Maya's direction:
  copy (and icon) should depend on the hour, not on state. An 8pm nudge
  with a smiling face if today's still open, and a sharper 10:30pm one
  with an alarmed face if it's *still* open by then. Neither fires if
  she's already done today's or used a freeze — celebration stays in-app
  (see voice.ts), a push notification's only job is reaching her if today
  never happened.
*/

export type NotificationTrigger = 'evening_nudge' | 'urgent_nudge'

export interface PushNotification {
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

/** 8pm check-in. Null if there's nothing to nudge about. */
export function eveningNudge(s: PlayerState, seed: number): PushNotification | null {
  if (s.dayStatus !== 'open') return null
  return {
    trigger: 'evening_nudge',
    title: APP_NAME,
    body: pick(EVENING_LINES, seed),
    icon: ICON_SMILING,
  }
}

/** 10:30pm check-in — only fires if the 8pm one didn't land. */
export function urgentNudge(s: PlayerState, seed: number): PushNotification | null {
  if (s.dayStatus !== 'open') return null
  return {
    trigger: 'urgent_nudge',
    title: APP_NAME,
    body: pick(URGENT_LINES, seed),
    icon: ICON_ALARMED,
  }
}
