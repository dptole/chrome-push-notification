const util = require('util')
    , path = require('path')
    , fs = require('fs')
    , staticModule = require('static-module')

module.exports = app => {
  const routes = {}

  util._extend(routes, {
    root_route(handler) {
      return (request, response, next) => {
        try {
          handler(request, response, next)
        } catch(error) {
          app.libs.log(error)
          response.status(500).json({error: {message: error.message}})
        }
      }
    },
    statics: {
      sw: {
        url: '/chrome_push_notification/gcm/sw.js',
        parse: app.static(path.join(__dirname, '/../views/static/'))
      },
      fcm_sw: {
        url: '/chrome_push_notification/fcm/sw.js',
        parse: (request, response, next) => {
          response.setHeader('content-type', 'text/javascript')
          fs.createReadStream(path.join(__dirname, '/../views/static/', request.url)).pipe(
            staticModule({
              'static-module-firebase-config': _ => JSON.stringify({
                messaging_sender_id: app.env.manifest_file.gcm_sender_id
              })
            })
          ).pipe(response)
        }
      }
    }
  })

  util._extend(routes, {
    methods: {
      get: {
        '/chrome_push_notification/gcm/manifest.json': [
          (request, response) => {
            response
              .header('content-type', 'application/manifest+json')
              .json(app.env.manifest_file)
          }
        ],
        '/chrome_push_notification/gcm/sw.js': [
          routes.statics.sw.parse
        ],
        '/chrome_push_notification/fcm/sw.js': [
          routes.statics.fcm_sw.parse
        ],
        '/chrome_push_notification/fcm/': [
          (request, response) => {
            response.render('fcm', {
              gcm_sender_id: app.env.manifest_file.gcm_sender_id
            })
          }
        ],
        '/chrome_push_notification/gcm/': [
          (request, response) => {
            response.render('gcm', {
              service_worker_url: routes.statics.sw.url,
              notification_icon: app.package.config.notification_icon,
            })
          }
        ],
        '/chrome_push_notification/get_news': [
          (request, response) => {
            app.libs.news.get().then(response =>
              app.libs.fcm.notifyNews(request.query.token, response.json.articles[0])
            ).catch(error =>
              app.libs.log(error)
            ).then(_ =>
              response.status(202).json({success: 'You will be notified in a while.'})
            )
          }
        ],
        '/chrome_push_notification/': [
          (request, response) => {
            response.redirect(302, '/chrome_push_notification/gcm/')
          }
        ]
      },
      post: {
        '/chrome_push_notification/notify': [
          (request, response) => {
            setTimeout(
              _ => app.libs.gcm.notifyUser(request.json),
              3000
            )
            response.status(202).json({success: 'You will be notified in a while.'})
          }
        ]
      }
    }
  })

  for(const method in routes.methods)
    for(const url in routes.methods[method])
      app.server[method].apply(app.server, [url].concat(routes.methods[method][url].map(routes.root_route)))

  return routes
}
