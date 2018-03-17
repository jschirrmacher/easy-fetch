'use strict'

function EasyFetch() {
  let defaultOptions = {method: 'GET', headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
  let fetchLogger = {
    debug: () => {},
    error: () => {}
  }

  function microseconds() {
    const hrTime = process.hrtime()
    return hrTime[0] * 1000000 + hrTime[1] / 1000
  }

  function easyFetch(url, options = {}) {
    const startTime = microseconds()
    return fetch(url, Object.assign({}, defaultOptions, options))
      .then(response => {
        const request = (options.method || 'GET').toUpperCase() + ' ' + url.replace(/^(https?:\/\/)[\w\.:=]+@/, '$1')
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

  easyFetch.addDefaultHeader = (name, value) => defaultOptions.headers[name] = value
  easyFetch.setAgent = agent => defaultOptions.agent = agent
  easyFetch.setLogger = logger => fetchLogger = logger

  return easyFetch
}

module.exports = EasyFetch
