importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-messaging.js')

firebase.initializeApp({
  apiKey: 'AAAAUP0jK_k:APA91bEcrnG850PQpqJO0qoGR_HrE0fsrWv2EOkvJlIhSzlcsQ9JOIfu7ADL2_pMsQIw7gIU18tzX0u-ZBoTbUR3IMrVag0AUJOsnN4bLSm09lZHcI5CiRAXfni1La6lJTQlMwy7xBtr',
  messagingSenderId: '347844324345'
})

const messaging = firebase.messaging()

const libs = {
  httpsRegex: /^https:\/\//i,
  last_event: null,
  ensureHTTPSURL(url) {
    return libs.httpsRegex.test(url) ? url : 'https://firebase.google.com/_static/images/firebase/touchicon-180.png'
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
    if(notification.type === 'notification') {
      const message = libs.parseJSON(notification.notification)
      if(!message.success) {
        console.log('Unable to parse notifications data', notification)
        return libs.noNotification()
      }

      return registration.showNotification(
        message.parsed.title,
        {
          body: message.parsed.body,
          icon: message.parsed.icon_uri,
          tag: message.parsed.tag
        }
      )
    } else if(notification.type === 'article') {
      const article = libs.parseJSON(notification.article)
      if(!article.success) {
        console.log('Unable to parse notifications data', notification)
        return libs.noNotification()
      }

      return registration.showNotification(
        article.parsed.source,
        {
          body: [article.parsed.title, article.parsed.description].filter(id => id).join(' | '),
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

    console.log('Unknown notification type', notification)
    return libs.noNotification()
  },
  handleNotification(payload) {
    return payload && payload.data
      ? libs.displayNotification(payload.data)
      : libs.noNotification().catch(_ => console.log('Unable to handle notifications payload', payload))
  },
  noNotification() {
    return registration.showNotification()
  },
  runNotificationAction(action) {
    if(action.type === 'read-news')
      clients.openWindow(action.url)
    else if(action.type === 'next-news')
      messaging.getToken().then(token =>
        fetch('https://dptole.ngrok.io/chrome_push_notification/get_news?token=' + token)
      )
    else if(action.type === 'click-action')
      clients.openWindow(action.url)
  },
  hasCurrentEventClickAction() {
    if(!(libs.last_event && libs.last_event.data))
      return false
    const json = libs.last_event.data.json()
    return json && json.data && libs.httpsRegex.test(json.data.click_action)
  },
  getCurrentEventClickAction() {
    if(!(libs.last_event && libs.last_event.data))
      return ''
    const json = libs.last_event.data.json()
    return json && json.data && libs.httpsRegex.test(json.data.click_action) && json.data.click_action
  },
  eventHandlers: {
    push(event) {
      libs.last_event = event
      console.log('push event', event)
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
      console.log('notificationClick event', event)
      event.notification.close()
      if(libs.isValidAction(event.action))
        libs.runNotificationAction(libs.parseJSON(event.action).parsed)
      else if(libs.isValidAction(event.notification.tag))
        libs.runNotificationAction(libs.parseJSON(event.notification.tag).parsed)
      else if(libs.hasCurrentEventClickAction())
        libs.runNotificationAction({type: 'click-action', url: libs.getCurrentEventClickAction()})
    }
  }
}

addEventListener('push', libs.eventHandlers.push)
addEventListener('notificationclick', libs.eventHandlers.notificationClick)
