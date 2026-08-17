import { supabase } from './supabaseClient'

export type PushStatus =
  | 'unsupported'
  | 'unconfigured'
  | 'denied'
  | 'off'
  | 'on'

/** What the UI should show before she's touched anything. */
export async function checkPushStatus(): Promise<PushStatus> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return 'unsupported'
  }
  if (!supabase || !import.meta.env.VITE_VAPID_PUBLIC_KEY) {
    return 'unconfigured'
  }
  if (Notification.permission === 'denied') return 'denied'

  const registration = await navigator.serviceWorker.getRegistration()
  const existing = await registration?.pushManager.getSubscription()
  return existing ? 'on' : 'off'
}

// The Push API wants the VAPID key as a raw byte array, not the base64url
// string it's generated and stored as everywhere else.
function urlBase64ToUint8Array(base64url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4)
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

/**
 * Full opt-in flow: register the service worker, ask for permission,
 * subscribe, and save the subscription where the nightly cron job can find
 * it. Throws with a message good enough to show her directly if any step
 * fails — there's no separate error-copy layer for this.
 */
export async function subscribeToPush(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error("This browser can't receive push notifications.")
  }
  if (!supabase) {
    throw new Error('Not connected to a backend yet — ask Claude.')
  }
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapidKey) {
    throw new Error('Push isn’t configured yet — ask Claude.')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notifications were blocked.')
  }

  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
  })

  const json = subscription.toJSON()
  const { error } = await supabase.from('push_subscription').upsert({
    id: 1,
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
}

export async function unsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration()
  const existing = await registration?.pushManager.getSubscription()
  await existing?.unsubscribe()
  await supabase?.from('push_subscription').delete().eq('id', 1)
}
