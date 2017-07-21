
module.exports = app => {
  app.server.use((request, response, next) => {
    response
      .header('access-control-allow-origin', '*')
      .header('access-control-allow-methods', 'get,post,put,delete')
    next()
  })

  app.server.use((request, response, next) => {
    response.on('finish', _ => {
      console.log((new Date).toJSON())
      console.log(response.statusCode, request.method, request.url, request.headers)
      console.log('Request JSON', request.json || '')
      console.log('='.repeat(100))
    })
    next()
  })

  app.server.use((request, response, next) => {
    let data = request.payload = ''
    request.setEncoding('utf-8')
    request.on('data', buffer => data += buffer)
    request.on('end', _ => {
      request.payload = data
      try {
        if(data.length)
          request.json = JSON.parse(data)
      } catch(error) {
        console.error('It was not possible to parse the request body as JSON')
        console.error('The payload is: ' + data)
        console.error(error)
      }
      next()
    })
  })
}
