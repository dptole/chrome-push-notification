const util = require('util')
    , path = require('path')

module.exports = app => {
  const routes = {}

  util._extend(routes, {
    root_route(handler) {
      return (request, response, next) => {
        try {
          handler(request, response, next)
        } catch(error) {
          response.status(500).json({error: {message: error.message}})
        }
      }
    },
    statics: {
      sw: {
        url: '/chrome_push_notification/sw.js',
        parse: app.static(path.join(__dirname, '/../views/static/'))
      }
    }
  })

  util._extend(routes, {
    methods: {
      get: {
        '/chrome_push_notification/manifest.json': [
          (request, response) => {
            response
              .header('content-type', 'application/manifest+json')
              .json(app.env.manifest_file)
          }
        ],
        '/chrome_push_notification/sw.js': [
          routes.statics.sw.parse
        ],
        '/chrome_push_notification/': [
          (request, response) => {
            response.render('home', {
              service_worker_url: routes.statics.sw.url,
              notification_icon: app.package.config.notification_icon,
            })
          }
        ]
      },
      post: {
        '/chrome_push_notification/notify': [
          (request, response) => {
            setTimeout(_ =>
              app.libs.notifyUser(request.json),
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
