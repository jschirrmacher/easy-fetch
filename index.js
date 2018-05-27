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

  function handleError(response, content) {
    const message = response.status + ' ' + response.statusText
    fetchLogger.error(message)
    fetchLogger.debug('string' === typeof content ? content : JSON.stringify(content))
    return Promise.reject({response, content, message, toString: () => content || message})
  }

  async function easyFetch(url, options = {}) {
    const startTime = microseconds()
    const response = await fetch(url, Object.assign({}, defaultOptions, options))
    const request = (options.method || 'GET').toUpperCase() + ' ' + url.replace(/^(https?:\/\/)[\w.:=]+@/, '$1')
    const requestTime = microseconds() - startTime
    const type = response.headers.get('content-type')
    const content = type.match(/json/) ? await response.json() : await response.text()
    fetchLogger.debug(request + ' (' + requestTime + 'µs)')
    return response.ok ? content : handleError(response, content)
  }

  easyFetch.addDefaultHeader = (name, value) => defaultOptions.headers[name] = value
  easyFetch.setAgent = agent => defaultOptions.agent = agent
  easyFetch.setLogger = logger => fetchLogger = logger

  return easyFetch
}

module.exports = EasyFetch
