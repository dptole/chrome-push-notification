const util = require('util')

module.exports = express => {
  const app = {}

  util._extend(app, {
    server: express(),
    static: express.static,
    env: require('./../env.json'),
    package: require('./../package.json'),

    listen() {
      return new Promise((resolve, reject) => {
        const server = app.server.listen(app.package.config.port, resolve)
        server.on('error', reject)
      })
    }
  })

  app.libs = require('./libs.js')(app)

  require('./configs.js')(app)
  require('./middlewares.js')(app)
  require('./routes.js')(app)

  return app
}
