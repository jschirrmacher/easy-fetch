'use strict'
/* eslint-env node, mocha */
require('should')

function requireFetch() {
  delete require.cache[require.resolve('..')]
  return require('..')
}

const headers = which => ({get: () => which})
const textHeader = headers('text/plain')
const jsonHeader = headers('application/json')

const json = () => ({a: 1})
const text = () => 'fetch result as text'

let messages = []

const logger = {
  debug: message => messages.push('DEBUG: ' + message),
  error: message => messages.push('ERROR: ' + message)
}

describe('easy-fetch', () => {
  it('should send request to the given url with the given method', done => {
    let lastRequest

    global.fetch = (url, options) => {
      lastRequest = (options.method || 'GET').toUpperCase() + ' ' + url
      return Promise.resolve({ok: true, headers: textHeader, text})
    }

    requireFetch()('http://example.com/path/file', {method: 'OPTIONS'})
      .then(result => {
        lastRequest.should.equal('OPTIONS http://example.com/path/file')
        result.should.equal('fetch result as text')
        done()
      })
      .catch(done)
  })

  it('should handle json responses', done => {
    global.fetch = () => Promise.resolve({ok: true, headers: jsonHeader, json})
    requireFetch()('http://example.com/path/file')
      .then(result => {
        result.should.deepEqual({a: 1})
        done()
      })
      .catch(done)
  })

  it('should log requests in debug level', done => {
    global.fetch = () => Promise.resolve({ok: true, headers: jsonHeader, json})
    const fetch = requireFetch()
    fetch.setLogger(logger)
    messages = []
    fetch('http://example.com/')
      .then(() => {
        messages.should.match(/^DEBUG: GET http:\/\/example.com\//)
        done()
      })
      .catch(done)
  })

  it('should log failing request in error level', done => {
    global.fetch = () => Promise.resolve({ok: false, status: 500, statusText: 'Error', headers: jsonHeader, json})
    const fetch = requireFetch()
    messages = []
    fetch.setLogger(logger)
    fetch('http://example.com/')
      .catch(() => {
        messages[1].should.equal('ERROR: 500 Error')
        done()
      })
      .catch(done)
  })

  it('should log information even if the request fails', done => {
    global.fetch = () => Promise.resolve({ok: false, status: 500, statusText: 'Error', headers: jsonHeader, json})
    const fetch = requireFetch()
    messages = []
    fetch.setLogger(logger)
    fetch('http://example.com/')
      .catch(() => {
        messages[0].should.match(/^DEBUG: GET http:\/\/example.com\//)
        done()
      })
      .catch(done)
  })

  it('should log the content if the request fails', done => {
    global.fetch = () => Promise.resolve({ok: false, status: 500, statusText: 'Error', headers: jsonHeader, json})
    const fetch = requireFetch()
    messages = []
    fetch.setLogger(logger)
    fetch('http://example.com/')
      .catch(() => {
        messages[2].should.match(/^DEBUG: {"a":1}/)
        done()
      })
      .catch(done)
  })

  it('should report request time', done => {
    global.fetch = () => Promise.resolve({ok: true, headers: jsonHeader, json})
    const fetch = requireFetch()
    fetch.setLogger(logger)
    messages = []
    fetch('http://example.com/')
      .then(() => {
        messages.should.match(/\(\d+\.\d+µs\)$/)
        done()
      })
      .catch(done)
  })

  it('should add default headers', done => {
    const token = '1234567890'
    let found
    global.fetch = (url, options) => {
      found = options.headers.Authorization === token
      return Promise.resolve({ok: true, headers: jsonHeader, json})
    }
    const fetch = requireFetch()
    fetch.addDefaultHeader('Authorization', token)
    fetch('http://example.com/')
      .then(() => {
        found.should.equal(true)
        done()
      })
      .catch(done)
  })

  it('should use a given agent', done => {
    const agent = {myAgent: true}
    let found = false
    global.fetch = (url, options) => {
      found = options.agent === agent
      return Promise.resolve({ok: true, headers: jsonHeader, json})
    }
    const fetch = requireFetch()
    fetch.setAgent(agent)
    fetch('http://example.com/')
      .then(() => {
        found.should.equal(true)
        done()
      })
      .catch(done)
  })

  it('should return error messages which can be converted into a string', done => {
    global.fetch = () => Promise.resolve({ok: false, status: 500, statusText: 'Error', headers: textHeader, text})
    const fetch = requireFetch()
    fetch('http://example.com/')
      .catch(error => {
        const message = error.toString()
        message.should.equal(text())
        done()
      })
      .catch(done)
  })

  it('should hide plain text login credentials from log files', done => {
    global.fetch = () => Promise.resolve({ok: true, headers: textHeader, text})
    const fetch = requireFetch()
    fetch.setLogger(logger)
    messages = []
    fetch('http://john.doe:secretpassword@example.com/file')
      .then(() => {
        messages[0].should.match(/^DEBUG: GET http:\/\/example.com\/file/)
        done()
      })
      .catch(done)
  })
})
