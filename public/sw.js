self.addEventListener('push', (event) => {
  if (!event.data) return
  let data
  try {
    data = event.data.json()
  } catch {
    return
  }
  const title = data.title || '라비크루 알림'
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(self.clients.openWindow(url))
})
