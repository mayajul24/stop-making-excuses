// Plain JS on purpose — service workers run outside the app's module graph
// and outside TypeScript's reach, in their own worker context with no
// access to anything in src/.

self.addEventListener('push', (event) => {
  let payload = { title: 'Stop Making Excuses', body: 'Something happened.' }
  try {
    if (event.data) payload = event.data.json()
  } catch {
    // Non-JSON payload — fall back to the default above rather than crash.
  }

  // No icon/badge — this project doesn't have an app icon asset yet, so
  // pointing at one would 404 silently. The OS falls back to its own
  // default notification icon in the meantime.
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
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
