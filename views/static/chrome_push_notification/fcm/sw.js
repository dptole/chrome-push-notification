importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-messaging.js')

const firebase_config = require('static-module-firebase-config')()

firebase.initializeApp({
  messagingSenderId: firebase_config.messaging_sender_id
})

const messaging = firebase.messaging()

storeNewUserToken()

const libs = {
  httpsRegex: /^https:\/\//i,
  events: [],

  getLastEvent: type => {
    const filtered_events = libs.events.filter(event => event.type === type)
    return filtered_events.length ? filtered_events[filtered_events.length - 1] : void 0
  },
  getLastPushEvent: _ => libs.getLastEvent('push'),

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
  receiveNotificationBehavior(payload) {
    return payload && payload.data
      ? libs.displayNotification(payload.data)
      : libs.noNotification().catch(_ => console.log('Unable to handle notifications payload', payload))
  },
  noNotification() {
    return registration.showNotification()
  },
  notificationClickBehavior(action) {
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
    if(!(libs.getLastPushEvent() && libs.getLastPushEvent().data))
      return false
    const json = libs.getLastPushEvent().data.json()
    return json && json.data && libs.httpsRegex.test(json.data.click_action)
  },
  getCurrentEventClickAction() {
    if(!(libs.getLastPushEvent() && libs.getLastPushEvent().data))
      return ''
    const json = libs.getLastPushEvent().data.json()
    return json && json.data && libs.httpsRegex.test(json.data.click_action) && json.data.click_action
  },
  addEvent(event) {
    event.time = new Date
    libs.events.push(event)
  },
  event_handlers: {
    push(event) {
      //@TODO notify server that the message was received.
      console.log('Push event', event)
      libs.addEvent(event)
      event.waitUntil(
        libs.receiveNotificationBehavior(event.data.json()).catch(error => {
          console.log('Error handling the notification')
          console.log(error)
          console.log('Event')
          console.log(event)
        })
      )
    },
    notificationClick(event) {
      //@TODO notify server that the notification was clicked.
      console.log('NotificationClick event', event)
      libs.addEvent(event)
      event.notification.close()
      if(libs.isValidAction(event.action))
        libs.notificationClickBehavior(libs.parseJSON(event.action).parsed)
      else if(libs.isValidAction(event.notification.tag))
        libs.notificationClickBehavior(libs.parseJSON(event.notification.tag).parsed)
      else if(libs.hasCurrentEventClickAction())
        libs.notificationClickBehavior({type: 'click-action', url: libs.getCurrentEventClickAction()})
    },
    install(event) {
      console.log('Install event', event)
      libs.addEvent(event)
      skipWaiting()
    },
    activate(event) {
      console.log('Activate event', event)
      libs.addEvent(event)
      skipWaiting()
    }
  }
}

addEventListener('push', libs.event_handlers.push)
addEventListener('notificationclick', libs.event_handlers.notificationClick)
addEventListener('activate', libs.event_handlers.activate)
addEventListener('install', libs.event_handlers.install)

function storeNewUserToken(send_to_server) {
  return messaging.getToken().then(token =>
    createFullDatabase('sw-db', 1, [{
      name: 'swTokens',
      options: {
        autoIncrement: true
      }
    }]).then(event =>
      new Promise((resolve, reject) => {
        const db = event.result.target.result

        const addData = db =>
          objectStoreAdd(db, 'swTokens', {
            subscriptionId: token,
            createdAt: Date.now()
          }).then(
            resolve.bind(null, event),
            reject
          )

        if(event.type === 'success')
          addData(db)
        else
          event.result.target.onsuccess = addData.bind(null, db)
      })
    ).then(() => {
      if(send_to_server) {
        const db = event.result.target.result
        objectStoreSearch(db, 'swTokens').then(results =>
          fetch('https://dptole.ngrok.io/chrome_push_notification/user_tokens?tokens=' + btoa(JSON.stringify(results)))
        )
      }
    })
  )
}

function createDatabase(name, version) {
  return new Promise((resolve, reject) => {
    const idb_open_request = indexedDB.open(name, version)

    idb_open_request.onerror = reject

    idb_open_request.onupgradeneeded = event =>
      resolve({
        type: 'upgradeneeded',
        result: event
      })

    idb_open_request.onsuccess = event =>
      resolve({
        type: 'success',
        result: event
      })
  })
}

function createFullDatabase(name, version, object_stores) {
  return createDatabase('sw-db').then(event => {
    if(event.type === 'upgradeneeded')
      return createObjectStores(event.result.target.result, object_stores).then(() =>
        event
      )
    else
      return event
  })
}

function createObjectStores(db, object_stores) {
  return new Promise((resolve, reject) => {
    db.onerror = reject
    try {
      object_stores.forEach(object_store =>
        db.createObjectStore(object_store.name, object_store.options)
      )

      resolve(db)
    } catch(error) {
      reject(error)
    }
  })
}

function objectStoreAdd(db, object_store_name, key, value) {
  return new Promise((resolve, reject) => {
    if(value === undefined) {
      value = key
      key = undefined
    }
    const transaction = db.transaction(object_store_name, 'readwrite')

    const object_store = transaction.objectStore(object_store_name)
    const object_store_request = object_store.add(value, key)
    object_store_request.onsuccess = resolve
    object_store_request.onerror = reject
  })
}

function objectStoreSearch(db, object_store_name, key, direction) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([object_store_name])
    const object_store = transaction.objectStore(object_store_name)
    const object_store_request = object_store.openCursor(key, direction)
    const result = []
    object_store_request.onsuccess = function(event) {
      const cursor = event.target.result
      if(cursor) {
        result.push({
          key: cursor.key,
          value: cursor.value
        })
        cursor.continue()
      } else
        resolve(result)
    }
    object_store_request.onerror = reject
  })
}
