// Plain JS on purpose — service workers run outside the app's module graph
// and outside TypeScript's reach, in their own worker context with no
// access to anything in src/.

// Without these, a new service worker sits "waiting" until every tab
// running the old one is closed — which for a PWA on a phone can mean
// never, since it's rarely fully closed. skipWaiting() lets it activate
// immediately; clients.claim() lets it take control of the open page
// right away instead of only on the next load. This is what makes a
// change like a new notification icon actually show up without her
// needing to manually clear site data.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = { title: 'Stop Making Excuses', body: 'Something happened.' }
  try {
    if (event.data) payload = event.data.json()
  } catch {
    // Non-JSON payload — fall back to the default above rather than crash.
  }

  // The server picks which face to send (smiling vs. alarmed, depending on
  // the time slot — see api/send-push.ts). Falls back to the calm one for
  // any payload that predates this field, or a non-JSON payload that never
  // parsed at all.
  //
  // badge is a separate slot from icon: Android renders it small and
  // monochrome (masking out color/detail itself, using only the alpha
  // channel as a stencil) for the status bar and the compact
  // stacked-notification row, while icon is the larger full color image.
  // pwa-192.png is an opaque colored square — no transparency for Android
  // to mask against — which is likely why the status bar was falling back
  // to a generic bell instead of showing anything shaped like the app.
  // badge-icon.png is a plain white silhouette on a transparent
  // background, built specifically for this slot.
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/notification-icon-annoyed.png',
      badge: '/badge-icon.png',
    }),
  )
})

// Tapping the notification focuses an already-open tab instead of always
// opening a fresh one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow('/')
    }),
  )
})
