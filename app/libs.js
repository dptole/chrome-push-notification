const https = require('https')
    , util = require('util')

module.exports = app => {
  const libs = {}

  return util._extend(libs, {
    log(...data) {
      console.log((new Date).toJSON())
      data.forEach(data => console.log(data))
      console.log('='.repeat(100))
    },
    request(method, hostname, path, json = null, headers = {}) {
      return new Promise((resolve, reject) => {
        app.libs.log(
          'OUTGOING REQUEST',
          method, hostname, path, json, headers
        )
        const response_object = {
                statusCode: null,
                headers: null,
                data: null,
                error: null
              }

        const request = https.request({
          method,
          hostname,
          path,
          headers
        }, response => {
          let data = ''
          response.setEncoding('utf-8')
          response.on('data', buffer => data += buffer)
          response.on('end', _ => {
            let json = null

            try {
              json = JSON.parse(data)
            } catch(error) {}

            util._extend(response_object, {
              statusCode: response.statusCode,
              headers: response.headers,
              data,
              json
            })

            app.libs.log(
              'OUTGOING RESPONSE',
              response.statusCode,
              response.headers,
              json
            )

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
        request.end(json && JSON.stringify(json) || '')
      })
    },
    sanitizeGoogleNewsJSON(json) {
      return json &&
        json.status === 'ok' &&
        util.isArray(json.articles) &&
        json.articles.length > 0 &&
        json.articles.filter(libs.sanitizeValidGoogleNewsArticle) ||
        []
    },
    sanitizeValidGoogleNewsArticle(article) {
      return article &&
        util.isString(article.title) &&
        util.isString(article.description) &&
        util.isString(article.url) &&
        /^https?:\/\/[^/]+/.test(article.url) &&
        util.isString(article.urlToImage) &&
        /^https?:\/\/[^/]+/.test(article.urlToImage) &&
        util.isString(article.publishedAt) &&
        /^\d{4}\-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(article.publishedAt)
    },
    news: {
      articles: [],
      get sources() {
        return ['abc-news-au', 'al-jazeera-english', 'ars-technica', 'associated-press', 'bbc-news', 'bbc-sport', 'bild', 'bloomberg', 'breitbart-news', 'business-insider', 'business-insider-uk', 'buzzfeed', 'cnbc', 'cnn', 'daily-mail', 'der-tagesspiegel', 'die-zeit', 'engadget', 'entertainment-weekly', 'espn', 'espn-cric-info', 'financial-times', 'focus', 'football-italia', 'fortune', 'four-four-two', 'fox-sports', 'google-news', 'gruenderszene', 'hacker-news', 'handelsblatt', 'ign', 'independent', 'mashable', 'metro', 'mirror', 'mtv-news', 'mtv-news-uk', 'national-geographic', 'new-scientist', 'new-york-magazine', 'newsweek', 'nfl-news', 'polygon', 'recode', 'reddit-r-all', 'reuters', 'spiegel-online', 't3n', 'talksport', 'techcrunch', 'techradar', 'the-economist', 'the-guardian-au', 'the-guardian-uk', 'the-hindu', 'the-huffington-post', 'the-lad-bible', 'the-new-york-times', 'the-next-web', 'the-sport-bible', 'the-telegraph', 'the-times-of-india', 'the-verge', 'the-wall-street-journal', 'the-washington-post', 'time', 'usa-today', 'wired-de', 'wirtschafts-woche']
      },
      get() {
        return libs.news.articles.length > 0
          ? Promise.resolve({json: {articles: [libs.news.articles.pop()]}})
          : libs.request(
              'get',
              'newsapi.org',
              `/v1/articles?source=${libs.news.getNextSource()}&sortBy=top&apiKey=${app.env.google_news_api_key}`
            ).then(response => {
              libs.news.articles.push.apply(libs.news.articles, response.json.articles)
              return response
            }).catch(error => {
              libs.log(error)
              return {json: {articles: []}}
            })
      },
      getNextSource() {
        return libs.news.articles.length === 0 && libs.news.sources[Math.random() * libs.news.sources.length | 0] || libs.news.sources[0]
      }
    },
    fcm: {
      notifyNews(token, article) {
        return libs.request(
          'post',
          'fcm.googleapis.com',
          '/fcm/send',
          {
            registration_ids: [token],
            data: {
              type: 'article',
              article
            }
          }, {
            Authorization: 'key=' + app.env.api_key,
            'Content-Type': 'application/json'
          }
        )
      }
    },
    gcm: {
      notifyUser(options) {
        return new Promise((resolve, reject) => {
          let subscription_id
            , response_object = {
                statusCode: null,
                headers: null,
                data: null,
                error: null
              }

          if(util.isString(options.endpoint))
            subscription_id = options.endpoint.match(/.*?([^/]+)$/) && RegExp.$1
          else
            return reject(
              util._extend(response_object, {
                error: 'Invalid subscriptionId.'
              })
            )

          const request = https.request({
            method: 'POST',
            hostname: 'android.googleapis.com',
            path: '/gcm/send',
            headers: {
              Authorization: 'key=' + app.env.api_key,
              'Content-Type': 'application/json'
            }
          }, response => {
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
    }
  })
}
