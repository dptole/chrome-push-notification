const path = require('path')
    , handlebarsExpress = require('express-handlebars')

module.exports = app => {
  app.server.disable('x-powered-by')
  app.server.disable('etag')

  app.server.engine('hbs', handlebarsExpress({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: path.resolve(__dirname + '/../views/layouts/'),
    partialsDir: path.resolve(__dirname + '/../views/partials/')
  }))

  app.server.set('view engine', 'hbs')
}
