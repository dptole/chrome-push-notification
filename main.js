const express = require('express')
    , handlebarsExpress = require('express-handlebars')
    , path = require('path')
    , package = require('./package.json')
    , port = package.config.port
    , app = express()

app.disable('x-powered-by')

app.engine('hbs', handlebarsExpress({
  extname: 'hbs',
  defaultLayout: 'main',
  layoutsDir: path.resolve(__dirname + '/views/layouts/'),
  partialsDir: path.resolve(__dirname + '/views/partials/')
}))
app.set('view engine', 'hbs')

app.get('*', (request, response) => response.render('hello-world'))

const server = app.listen(port, _ => console.log(`Running HTTP server on port ${port}...`))
