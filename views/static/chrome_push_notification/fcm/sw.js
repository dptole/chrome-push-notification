importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-messaging.js')

firebase.initializeApp({
  apiKey: 'AAAAUP0jK_k:APA91bEcrnG850PQpqJO0qoGR_HrE0fsrWv2EOkvJlIhSzlcsQ9JOIfu7ADL2_pMsQIw7gIU18tzX0u-ZBoTbUR3IMrVag0AUJOsnN4bLSm09lZHcI5CiRAXfni1La6lJTQlMwy7xBtr',
  messagingSenderId: '347844324345'
})

const messaging = firebase.messaging()

messaging.setBackgroundMessageHandler(payload => {
  if(payload.data)
    displayNotification(payload.data)
})

addEventListener('notificationclick', event => {
  event.notification.close()
  if(isValidAction(event.action))
    runNotificationAction(parseJSON(event.action).parsed)
})

function runNotificationAction(action) {
  if(action.type === 'read-news')
    clients.openWindow(action.url)
  else if(action.type === 'next-news')
    messaging.getToken().then(token =>
      fetch('https://dptole.ngrok.io/chrome_push_notification/get_news?token=' + token)
    )
}

function ensureURL(url) {
  return /^https?:\/\//i.test(url) ? url : 'https://firebase.google.com/_static/images/firebase/touchicon-180.png'
}

function isValidAction(action) {
  return parseJSON(action).success
}

function displayNotification(notification) {
  if(notification.type === 'article') {
    const article = parseJSON(notification.article)
    if(!article.success) return false
    registration.showNotification(
      article.parsed.title,
      {
        body: article.parsed.description,
        icon: ensureURL(article.parsed.urlToImage),
        actions: [{
          title: 'Read',
          action: JSON.stringify({type: 'read-news', url: article.parsed.url})
        }, {
          title: 'Next',
          action: JSON.stringify({type: 'next-news'})
        }]
      }
    )
    return true
  }

  return false
}

function parseJSON(json_string) {
  try {
    return {
      success: true,
      parsed: JSON.parse(json_string)
    }
  } catch(error) {
    return {
      error
    }
  }
}
