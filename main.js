const server = require('./app/')(require('express'))

server.listen().then(_ =>
  console.log(`Running server on port ${server.package.config.port}...`)
).catch(error => {
  console.log('Error trying to start the server')
  console.log(error)
})
