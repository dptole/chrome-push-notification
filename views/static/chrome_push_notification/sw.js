self.addEventListener('push', function(event) {
  event.waitUntil(
    self.registration.showNotification('Hey!', {
      body: 'This notification was sent by the server.',
      icon: 'https://assets-cdn.github.com/favicon.ico'
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    self.registration.showNotification('Click!', {
      body: 'I see you have just clicked my notification.',
      icon: 'https://assets-cdn.github.com/favicon.ico'
    })
  );
})
