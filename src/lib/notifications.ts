import type { PlayerState } from '../types'
import { COURAGE_MAX } from './game'

/*
  What a real push notification system would send, and when — content and
  trigger logic only. Actually delivering these to her phone needs a
  backend: something to hold her subscription and fire on a schedule even
  when the app isn't open. That doesn't exist yet and is a separate, larger
  build. This is the library it would read from once it does.

  Deliberately louder than the in-app voice on purpose, not by oversight.
  The app itself stays gentle — "still here when you're ready" — because
  guilt-tripping her while she's looking at the thing that's supposed to
  help isn't fair. A push notification is a different contract: she opted
  in to be bugged on her lock screen specifically, so this is where the
  nagging energy from the original brief actually belongs.
*/

export type NotificationTrigger =
  | 'streak_dying'
  | 'inactivity_mild'
  | 'inactivity_severe'
  | 'villain_arc'
  | 'week_complete'
  | 'courage_full'
  | 'new_week'

export interface PushNotification {
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

const NEW_WEEK = [
  'New week. New chance to be brave 🐣',
  'Clean slate. Let\'s go.',
]

/** Deterministic pick so re-checking the same moment doesn't reshuffle copy. */
function pick(list: string[], seed: number): string {
  return list[Math.abs(seed) % list.length]
}

function notif(trigger: NotificationTrigger, body: string): PushNotification {
  return { trigger, title: APP_NAME, body }
}

/**
 * What a scheduled job would send right now, given the player's state and
 * how many days old the current week is. Returns null when there's nothing
 * worth interrupting her for — most days, most of the time. Priority order
 * matters: a dying streak always outranks a generic inactivity nudge.
 */
export function nextPushNotification(
  s: PlayerState,
  daysIn: number,
  seed: number,
): PushNotification | null {
  if (s.weekStatus === 'done') {
    return notif('week_complete', pick(WEEK_COMPLETE, seed))
  }

  // She used a freeze on purpose — respect it, no nag.
  if (s.weekStatus === 'frozen') return null

  const trailing = s.history.slice(-3)
  if (trailing.length === 3 && trailing.every((w) => w.status === 'missed')) {
    return notif('villain_arc', pick(VILLAIN_ARC, seed))
  }

  if (s.streakCurrent >= 1 && daysIn >= 6) {
    return notif('streak_dying', pick(STREAK_DYING, seed))
  }

  if (daysIn >= 6) {
    return notif('inactivity_severe', pick(INACTIVITY_SEVERE, seed))
  }

  if (daysIn >= 3) {
    return notif('inactivity_mild', pick(INACTIVITY_MILD, seed))
  }

  if (daysIn === 0) {
    return notif('new_week', pick(NEW_WEEK, seed))
  }

  if (s.courage >= COURAGE_MAX) {
    return notif('courage_full', pick(COURAGE_FULL, seed))
  }

  return null
}
