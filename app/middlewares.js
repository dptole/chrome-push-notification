
module.exports = app => {
  app.server.use((request, response, next) => {
    response
      .header('access-control-allow-origin', '*')
      .header('access-control-allow-methods', 'get,post,put,delete')
    next()
  })

  app.server.use((request, response, next) => {
    response.on('finish', _ => {
      app.libs.log(
        response.statusCode, request.method, request.url, request.headers,
        'Request JSON', request.json || '',
      )
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
        request.json = JSON.parse(data)
      } catch(error) {}
      next()
    })
  })
}
