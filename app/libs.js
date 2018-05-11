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
    news: {
      articles: {},
      get sources() {
        return ['abc-news-au', 'al-jazeera-english', 'ars-technica', 'associated-press', 'bbc-news', 'bbc-sport', 'bild', 'bloomberg', 'breitbart-news', 'business-insider', 'business-insider-uk', 'buzzfeed', 'cnbc', 'cnn', 'daily-mail', 'der-tagesspiegel', 'die-zeit', 'engadget', 'entertainment-weekly', 'espn', 'espn-cric-info', 'financial-times', 'focus', 'football-italia', 'fortune', 'four-four-two', 'fox-sports', 'google-news', 'gruenderszene', 'hacker-news', 'handelsblatt', 'ign', 'independent', 'mashable', 'metro', 'mirror', 'mtv-news', 'mtv-news-uk', 'national-geographic', 'new-scientist', 'new-york-magazine', 'newsweek', 'nfl-news', 'polygon', 'recode', 'reddit-r-all', 'reuters', 'spiegel-online', 't3n', 'talksport', 'techcrunch', 'techradar', 'the-economist', 'the-guardian-au', 'the-guardian-uk', 'the-hindu', 'the-huffington-post', 'the-lad-bible', 'the-new-york-times', 'the-next-web', 'the-sport-bible', 'the-telegraph', 'the-times-of-india', 'the-verge', 'the-wall-street-journal', 'the-washington-post', 'time', 'usa-today', 'wired-de', 'wirtschafts-woche']
      },
      getRandomArticleFromSource(source) {
        if(!libs.news.hasArticles(source))
          return false

        const articles = libs.news.articles[source]
        const random_index = Math.random() * articles.length | 0
        const article = articles.splice(random_index, 1)

        if(articles.length < 1)
          delete libs.news.articles[source]

        return article[0]
      },
      hasArticles(source) {
        return source in libs.news.articles
      },
      addArticles(source, articles) {
        libs.news.articles[source] = articles
      },
      async get() {
        const source = libs.news.getNextSource()
        if(libs.news.hasArticles(source))
          return libs.news.getRandomArticleFromSource(source)

        return await libs.request(
          'get',
          'newsapi.org',
          `/v1/articles?source=${source}&apiKey=${app.env.google_news_api_key}`
        ).then(response => {
          libs.news.addArticles(source, response.json.articles)
          const article = libs.news.getRandomArticleFromSource(source)
          return {
            json: {
              articles: [
                util._extend(article, {
                  source: source[0].toUpperCase() + source.substr(1).replace(/-/g, ' ')
                })
              ]
            }
          }
        }).catch(error => {
          libs.log(error)
          return {json: {articles: []}}
        })
      },
      getNextSource() {
        const sources = libs.news.sources
        return sources[Math.random() * sources.length | 0]
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
              /*
                Default notification with optional click action:
                
                  type: 'notification',
                  notification: {
                    title: string,
                    body: string,
                    tag: string,
                    icon_uri: string
                  },
                  click_action: url (optional)
                
                Article notification
                
                  type: 'article',
                  article: {
                    source: string,
                    title: string,
                    description: string,
                    urlToImage: url,
                    url: url
                  }
              */

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
        return libs.request(
          'post',
          'android.googleapis.com',
          '/gcm/send',
          {
            registration_ids: [options.endpoint.match(/.*?([^/]+)$/) && RegExp.$1]
          }, {
            Authorization: 'key=' + app.env.api_key,
            'Content-Type': 'application/json'
          }
        )
      }
    }
  })
}
