const https = require('https')
    , util = require('util')

module.exports = app => {
  const libs = {}

  return util._extend(libs, {
    notifyUser(options) {
      return new Promise((resolve, reject) => {
        let subscription_id
          , response_object = {
              statusCode: null,
              headers: null,
              data: null,
              error: null
            }
  
        if(util.isString(options.endpoint)) {
          subscription_id = options.endpoint.match(/.*?([^/]+)$/) && RegExp.$1
        } else
          return reject(util._extend(response_object, {
            error: 'Invalid subscriptionId.'
          }))

        const request = https.request({
          method: 'POST',
          hostname: 'fcm.googleapis.com',
          path: '/fcm/send',
          headers: {
            Authorization: 'key=' + app.env.api_key,
            'Content-Type': 'application/json'
          }
        }, response => {
          user_to_notify = null
          let data = ''
          response.setEncoding('binary')
          response.on('data', buffer => data += buffer)
          response.on('end', _ => {
            util._extend(response_object, {
              statusCode: response.statusCode,
              headers: response.headers,
              data
            })

            if(199 < response.statusCode && response.statusCode < 300)
              resolve(response_object)
            else
              reject(response_object)
          })
        })
        request.on('error', error =>
          reject(util._extend(response_object, {
            error
          }))
        )
        request.end(
          JSON.stringify({
            registration_ids: [subscription_id]
          })
        )
      })
    }
  })
}
