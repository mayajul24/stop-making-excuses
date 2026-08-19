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

  // The character herself, unimpressed — rendered from Mascot.tsx's
  // 'unimpressed' mood (same SVG the in-app path screen uses), not the
  // generic app icon. Every reminder that reaches this far is a nag by
  // definition, so the face on it should say so before she even opens it.
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/notification-icon-annoyed.png',
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
