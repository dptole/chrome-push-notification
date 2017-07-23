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
  else if(isValidAction(event.notification.tag))
    runNotificationAction(parseJSON(event.notification.tag).parsed)
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
      article.parsed.source,
      {
        body: [article.parsed.title, article.parsed.description].join(' | '),
        icon: ensureURL(article.parsed.urlToImage),
        tag: JSON.stringify({type: 'read-news', url: article.parsed.url}),
        actions: [{
          title: 'Read',
          action: JSON.stringify({type: 'read-news', url: article.parsed.url}),
            icon: 'https://cdn0.iconfinder.com/data/icons/solid-line-essential-ui-icon-set/512/essential_set_menu-32.png'
        }, {
          title: 'Next',
          action: JSON.stringify({type: 'next-news'}),
          icon: 'https://cdn3.iconfinder.com/data/icons/google-material-design-icons/48/ic_arrow_forward_48px-32.png'
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
