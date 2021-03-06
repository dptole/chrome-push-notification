var orders = {};

self.addEventListener('push', function(event) {
  event.waitUntil(
    self.registration.pushManager.getSubscription().then(function(subscription) {
      return self.registration.showNotification('Here it is!', {
        body: 'Enjoy your ' + orders[subscription.endpoint] + '.',
        icon: 'https://avatars3.githubusercontent.com/u/3951114'
      });
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  var product = getProductByAction(event.action)
    , message = getMessageByAction(event.action)
  ;

  product && event.waitUntil(
    self.registration.pushManager.getSubscription().then(function(subscription) {
      return fetch('https://dptole.ngrok.io/chrome_push_notification/notify', {
        method: 'post',
        body: JSON.stringify({endpoint: subscription.endpoint}),
        headers: {
          'content-type': 'application/json'
        }
      }).then(function(response) {
        if(response.status !== 202)
          return self.registration.showNotification('Ops!', {
            body: 'Our waiter is busy at the moment, wait a little bit please.',
            icon: 'https://avatars3.githubusercontent.com/u/3951114'
          });
        orders[subscription.endpoint] = product;
        return self.registration.showNotification('As you wish!', {
          body: message,
          icon: 'https://avatars3.githubusercontent.com/u/3951114'
        });
      });
    }).catch(function(error) {
      console.log('Error', error);
      return self.registration.showNotification('Ops!', {
        body: 'I forgot what you have asked!',
        icon: 'https://avatars3.githubusercontent.com/u/3951114'
      });
    })
  );
});

function getProductByAction(action) {
  return action === 'action-beer'
    ? 'beer'

    : action === 'action-cake'
    ? 'cake'

    : ''
  ;
}

function getMessageByAction(action) {
  return action === 'action-beer'
    ? 'Ok I\'m going to get your beer ' + String.fromCharCode(0xD83C, 0xDF7A) + '.'

    : action === 'action-cake'
    ? 'Ok I\'m going to get your cake ' + String.fromCharCode(0xD83C, 0xDF70) + '.'

    : ''
  ;
}
