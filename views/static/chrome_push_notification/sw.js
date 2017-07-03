var orders = {};

self.addEventListener('push', function(event) {
  event.waitUntil(
    self.registration.pushManager.getSubscription().then(function(subscription) {
      return self.registration.showNotification('Here it is!', {
        body: 'Enjoy your ' + orders[subscription.endpoint] + '.',
        icon: 'https://assets-cdn.github.com/favicon.ico'
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
        body: JSON.stringify({subscriptionId: subscription.endpoint.match(/.*?([^/]+)$/) && RegExp.$1}),
        headers: {
          'content-type': 'application/json'
        }
      }).then(function(response) {
        if(response.status !== 202)
          return self.registration.showNotification('Ops!', {
            body: 'We are running out of ' + product + ' at the moment! Do you want to ask something else?',
            icon: 'https://assets-cdn.github.com/favicon.ico'
          });
        orders[subscription.endpoint] = product;
        return self.registration.showNotification('As you wish!', {
          body: message,
          icon: 'https://assets-cdn.github.com/favicon.ico'
        });
      });
    }).catch(function(error) {
      console.log('Error', error);
      return self.registration.showNotification('Ops!', {
        body: 'I forgot what you have asked!',
        icon: 'https://assets-cdn.github.com/favicon.ico'
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
