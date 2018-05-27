'use strict'
/* eslint-env node, mocha */
const should = require('should')
const EasyFetch = require('..')

const headers = which => ({get: () => which})
const textHeader = headers('text/plain')
const jsonHeader = headers('application/json')

const json = () => ({a: 1})
const text = () => 'fetch result as text'

function Logger() {
  let messages = []
  return {
    debug: message => messages.push('DEBUG: ' + message),
    error: message => messages.push('ERROR: ' + message),
    getMessages: () => messages
  }
}

function errorResult(thisHeaders = jsonHeader) {
  return () => Promise.resolve({ok: false, status: 500, statusText: 'Error', headers: thisHeaders, json, text})
}

function okResult(thisHeaders = jsonHeader) {
  return () => Promise.resolve({ok: true, headers: thisHeaders, json, text})
}

describe('easy-fetch', () => {
  it('should send request to the given url with the given method', async () => {
    let lastRequest

    global.fetch = (url, options) => {
      lastRequest = (options.method || 'GET').toUpperCase() + ' ' + url
      return Promise.resolve({ok: true, headers: textHeader, text})
    }

    const fetch = new EasyFetch()
    const result = await fetch('http://example.com/path/file', {method: 'OPTIONS'})
    lastRequest.should.equal('OPTIONS http://example.com/path/file')
    result.should.equal('fetch result as text')
  })

  it('should handle json responses', async () => {
    global.fetch = okResult()
    const fetch = new EasyFetch()
    const result = await fetch('http://example.com/path/file')
    result.should.deepEqual({a: 1})
  })

  it('should log requests in debug level', async () => {
    global.fetch = okResult()
    const fetch = new EasyFetch()
    const logger = new Logger()
    fetch.setLogger(logger)
    await fetch('http://example.com/')
    logger.getMessages().should.match(/^DEBUG: GET http:\/\/example.com\//)
  })

  it('should log failing request in error level', async () => {
    const logger = new Logger()
    try {
      global.fetch = errorResult()
      const fetch = new EasyFetch()
      fetch.setLogger(logger)
      await fetch('http://example.com/')
      should.fail()
    } catch (error) {
      logger.getMessages()[1].should.equal('ERROR: 500 Error')
    }
  })

  it('should log information even if the request fails', async () => {
    const logger = new Logger()
    try {
      global.fetch = errorResult()
      const fetch = new EasyFetch()
      fetch.setLogger(logger)
      await fetch('http://example.com/')
      should.fail()
    } catch (error) {
      logger.getMessages()[0].should.match(/^DEBUG: GET http:\/\/example.com\//)
    }
  })

  it('should log the content if the request fails', async () => {
    const logger = new Logger()
    try {
      global.fetch = errorResult()
      const fetch = new EasyFetch()
      fetch.setLogger(logger)
      await fetch('http://example.com/')
      should.fail()
    } catch (error) {
      error.message.should.equal('500 Error')
      logger.getMessages()[2].should.match(/^DEBUG: {"a":1}/)
    }
  })

  it('should report request time', async () => {
    global.fetch = okResult()
    const fetch = new EasyFetch()
    const logger = new Logger()
    fetch.setLogger(logger)
    await fetch('http://example.com/')
    logger.getMessages().should.match(/\(\d+\.\d+µs\)$/)
  })

  it('should add default headers', async () => {
    const token = '1234567890'
    let found
    global.fetch = (url, options) => {
      found = options.headers.Authorization === token
      return Promise.resolve({ok: true, headers: jsonHeader, json})
    }
    const fetch = new EasyFetch()
    fetch.addDefaultHeader('Authorization', token)
    await fetch('http://example.com/')
    found.should.equal(true)
  })

  it('should use a given agent', async () => {
    const agent = {myAgent: true}
    global.fetch = function fetch(url, options) {
      if (options.agent !== agent) {
        throw Error('agent not found')
      }
      return Promise.resolve({ok: true, headers: jsonHeader, json})
    }
    const fetch = new EasyFetch()
    fetch.setAgent(agent)
    await fetch('http://example.com/')
  })

  it('should return error messages which can be converted into a string', async () => {
    try {
      global.fetch = errorResult(textHeader)
      const fetch = new EasyFetch()
      await fetch('http://example.com/')
      should.fail()
    } catch (error) {
      const message = error.toString()
      message.should.equal(text())
    }
  })

  it('should hide plain text login credentials from log files', async () => {
    global.fetch = () => Promise.resolve({ok: true, headers: textHeader, text})
    const fetch = new EasyFetch()
    const logger = new Logger()
    fetch.setLogger(logger)
    await fetch('http://john.doe:secretpassword@example.com/file')
    logger.getMessages()[0].should.match(/^DEBUG: GET http:\/\/example.com\/file/)
  })

  it('should have a new context each time it is required', async () => {
    global.fetch = function fetch(url, options) {
      if ('1' === options.headers.test) {
        return Promise.resolve({ok: true, headers: jsonHeader, json})
      } else {
        throw Error('header not found')
      }
    }

    const fetch0 = new EasyFetch()
    fetch0.addDefaultHeader('test', '1')

    const fetch = new EasyFetch()
    try {
      const result = await fetch0('http://example.com')
      result.should.deepEqual({a: 1})
      await fetch('http://example.com/')
      should.fail()
    } catch (error) {
      error.message.should.equal('header not found')
    }
  })
})
