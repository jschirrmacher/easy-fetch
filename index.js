'use strict'

let defaultOptions = {method: 'GET', headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
let fetchLogger = {
  debug: () => {
  }, error: () => {
  }
}

function microseconds() {
  const hrTime = process.hrtime()
  return hrTime[0] * 1000000 + hrTime[1] / 1000
}

function simpleFetch(url, options = {}) {
  const startTime = microseconds()
  return fetch(url, Object.assign({}, defaultOptions, options))
    .then(response => {
      const request = (options.method || 'GET').toUpperCase() + ' ' + url
      const requestTime = microseconds() - startTime
      const type = response.headers.get('content-type')
      return Promise.resolve(type.match(/json/) ? response.json() : response.text())
        .then(content => {
          fetchLogger.debug(request + ' (' + requestTime + 'µs)')
          if (response.ok) {
            return content
          } else {
            const message = response.status + ' ' + response.statusText
            fetchLogger.error(message)
            fetchLogger.debug('string' === typeof content ? content : JSON.stringify(content))
            return Promise.reject({response, content, message, toString: () => content || message})
          }
        })
    })
}

simpleFetch.addDefaultHeader = (name, value) => defaultOptions.headers[name] = value
simpleFetch.setAgent = agent => defaultOptions.agent = agent
simpleFetch.setLogger = logger => fetchLogger = logger

module.exports = simpleFetch
