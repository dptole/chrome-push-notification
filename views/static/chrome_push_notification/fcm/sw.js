importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-messaging.js')

firebase.initializeApp({
  apiKey: 'AAAAUP0jK_k:APA91bEcrnG850PQpqJO0qoGR_HrE0fsrWv2EOkvJlIhSzlcsQ9JOIfu7ADL2_pMsQIw7gIU18tzX0u-ZBoTbUR3IMrVag0AUJOsnN4bLSm09lZHcI5CiRAXfni1La6lJTQlMwy7xBtr',
  messagingSenderId: '347844324345'
})

const messaging = firebase.messaging()

const libs = {
  ensureHTTPSURL(url) {
    return /^https:\/\//i.test(url) ? url : 'https://firebase.google.com/_static/images/firebase/touchicon-180.png'
  },
  isValidAction(action) {
    return libs.parseJSON(action).success
  },
  parseJSON(json_string) {
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
  },
  displayNotification(notification) {
    if(notification.type === 'article') {
      const article = libs.parseJSON(notification.article)
      if(article.success)
        return registration.showNotification(
          article.parsed.source,
          {
            body: [article.parsed.title, article.parsed.description].join(' | '),
            icon: libs.ensureHTTPSURL(article.parsed.urlToImage),
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
    }
  },
  handleNotification(payload) {
    return payload.data
      ? libs.displayNotification(payload.data)
      : registration.showNotification()
  },
  runNotificationAction(action) {
    if(action.type === 'read-news')
      clients.openWindow(action.url)
    else if(action.type === 'next-news')
      messaging.getToken().then(token =>
        fetch('https://dptole.ngrok.io/chrome_push_notification/get_news?token=' + token)
      )
  },
  eventHandlers: {
    push(event) {
      event.waitUntil(
        libs.handleNotification(event.data.json()).catch(error => {
          console.log('Error handling the notification')
          console.log(error)
          console.log('Event')
          console.log(event)
        })
      )
    },
    notificationClick(event) {
      event.notification.close()
      if(libs.isValidAction(event.action))
        libs.runNotificationAction(libs.parseJSON(event.action).parsed)
      else if(libs.isValidAction(event.notification.tag))
        libs.runNotificationAction(libs.parseJSON(event.notification.tag).parsed)
    }
  }
}

addEventListener('push', libs.eventHandlers.push)
addEventListener('notificationclick', libs.eventHandlers.notificationClick)
