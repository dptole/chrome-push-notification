const package = require('./package.json')
    , env = require('./env.json')
    , path = require('path')
    , https = require('https')
    , express = require('express')
    , handlebarsExpress = require('express-handlebars')

    , api_key = env.api_key
    , cpn_root_url = package.config.base_url
    , cpn_notify_via_server_url = path.join(cpn_root_url, 'notify')
    , port = package.config.port
    , service_worker_path = path.join(cpn_root_url, 'sw.js')
    , _service_worker_path = path.join(cpn_root_url, '*.js')
    , manifest_json_path = path.join(cpn_root_url, 'manifest.json')
    , static_middleware_path = path.join(__dirname, package.config.static_folder)
    , static_middleware = express.static(static_middleware_path)
    , app = express()

let user_to_notify = null

function notifyUser() {
  return new Promise((resolve, reject) =>
    setTimeout(_ => {
      const request = https.request({
        method: 'POST',
        hostname: 'android.googleapis.com',
        path: '/gcm/send',
        headers: {
          Authorization: 'key=' + api_key,
          'Content-Type': 'application/json'
        }
      }, response => {
        user_to_notify = null
        if(response.statusCode === 200) {
          let data = ''
          response.on('data', buffer => data += buffer)
          response.on('end', _ => {
            response.body = data
            resolve(response)
          })
        } else
          reject(response)
      })
      request.end(
        JSON.stringify({
          registration_ids: [user_to_notify]
        })
      )
      request.on('error', error => {
        user_to_notify = null
        reject(error)
      })
    },
      5000
    )
  )
}

app.disable('x-powered-by')
app.disable('etag')

app.engine('hbs', handlebarsExpress({
  extname: 'hbs',
  defaultLayout: 'main',
  layoutsDir: path.resolve(__dirname + '/views/layouts/'),
  partialsDir: path.resolve(__dirname + '/views/partials/')
}))
app.set('view engine', 'hbs')

app.use((request, response, next) => {
  response.on('finish', _ => {
    console.log(response.statusCode, request.method, request.url, request.headers && request.headers['user-agent'] || '<unknown user-agent>')
    console.log('Request JSON', request.json || '')
  })
  next()
})

app.use((request, response, next) => {
  let data = request.raw = ''
  if(/^post|put$/i.test(request.method)) {
    request.on('data', buffer => data += buffer)
    request.on('end', _ => {
      request.raw = data
      try {
        request.json = JSON.parse(data)
      } catch(error) {
        console.error('It was not possible to parse the request body as JSON')
        console.error('The payload is: ' + data)
        console.error(error)
      }
      next()
    })
  } else
    next()
})

app.get([_service_worker_path], (request, response, next) => {
  request.url = service_worker_path
  static_middleware(request, response, next)
})
app.get(manifest_json_path, (request, response) =>
  response
    .header('content-type', 'application/manifest+json')
    .json(env.manifest_file)
)

app.get(cpn_root_url, (request, response) =>
  response.render('home', {
    service_worker_url: service_worker_path.replace('sw.js', 'sw-' + (+new Date) + '.js'),
    notification_icon: package.config.notification_icon,
    push_notification_url: cpn_notify_via_server_url
  })
)

app.post(cpn_notify_via_server_url, (request, response) => {
  response
    .header('access-control-allow-origin', '*')
    .header('access-control-allow-methods', 'POST')

  if(request.json && request.json.subscriptionId && typeof(request.json.subscriptionId) === 'string' && request.json.subscriptionId.length > 0 && user_to_notify === null) {
    user_to_notify = request.json.subscriptionId
    notifyUser()
    response.status(202).json({success: 'You will be notified in a while.'})
  } else if(user_to_notify !== null)
    response.status(503).json({error: 'Try again later.'})
  else
    response.status(400).json({error: 'Invalid subscriptionId.'})
})

const server = app.listen(port, _ => console.log(`Running HTTP server on port ${port}...`))
