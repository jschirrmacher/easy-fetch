# js-easy-fetch

The goals of this packages are...

1. ... to reduce boilerplate code
2. ... make it easier to add the same (e.g. Authorization) headers on every request
3. ... use a custom http agent, e.g. if you need to use company CAs
4. ... make debugging easier by using a logging mechanism
5. ... stay compatible with window.fetch API like [node-fetch](https://www.npmjs.com/package/node-fetch)

## Usage examples

In every case, you need to require your favourite fetch function first and assign it to the global scope, then require or import `js-easy-fetch`:

```javascript
global.fetch = require('node-fetch')
const fetch = require('js-easy-fetch')()
```

If you need multiple instances of js-easy-fetch (e.g. because you need different authentication headers), you can create
them by first requiring the constructor and then instantiate the different fetch instances:

```javascript
const EasyFetch = require('js-easy-fetch')
const twitterFetch = new EasyFetch()
twitterFetch.addDefaultHeader('Authorization', 'Bearer ' + twitterToken)
const facebookFetch = new EasyFetch()
facebookFetch.addDefaultHeader('Authorization', 'Bearer ' + facebookToken)
```

### Doing fetches
```javascript
try {
  const result = await fetch('https://httpbin.org/anything')
  console.log(result.headers['User-Agent'])
} catch (error) {
  console.error('' + error)
}
```

In case fetch failed, the error is an object containing the HTTP response, the parsed content, the http error message (a string combined of the status code and the status text) and a `toString()` function to make it easy to print it like shown in the example above, which appends the object to an empty string (which implicitly calls `toString()`).

The `toString()` function returns either the content if it is not empty or the message. This makes it possible to use more complex error information provided by the server.

### Use authentication

If you have a authentication token and want to add it in every request you do, just add a call prior to all fetches:

```javascript
fetch.addDefaultHeader('Authorization', 'Bearer ' + JsonWebToken)
```

Likewise you can add more headers if you need them.

### Accept known CA certificates

Put all accepted CA certificates into a folder and use the following code:

```javascript
const https = require('https')
const fs = require('fs')

const ca = []
const certDir = __dirname + '/certs/'
fs.readdirSync(certDir).forEach(file => ca.push(fs.readFileSync(certDir + '/' + file, {encoding: 'utf-8'})))
fetch.setAgent(new https.Agent({ca}))

fetch('https://my-server-with-custom-ca.com/anything')
```

### Log errors or calls

Use the logger of your choice:

```javascript
const winston = require('winston')
fetch.setLogger(winston)
```

Or even create your own (it just needs functions `debug()` and `error()`):
```javascript
const logger = {
  debug: message => console.log('DEBUG: ' + message),
  error: message => console.error('ERROR: ' + message)
}
fetch.setLogger(logger)
```

*js-easy-fetch* logs failing request with `error()` and info about requests and request performance with `debug()`:

```
DEBUG: GET https://httpbin.org/status/404 (898435.3980102539µs)
ERROR: 404 NOT FOUND
```

In case of a failing request, in addition to the error, the content of the request is also logged (with `debug()`) which might help to make it easier to find the source of the problem.

## Upgrading from version 1.x

The main difference between versions 1.x and 2.x is that `js-easy-fetch` needs to be instantiated now.
This helps using multiple fetch contexts (e.g. using different default headers for different servers).
But on the other hand, it requires to modify your code. Instead of

```javascript
const fetch = require('js-easy-fetch')
```

you need
```javascript
const EasyFetch = require('js-easy-fetch')
const fetch = new EasyFetch()
```

or, if you dont need multiple contexts, but like shortness:
```javascript
const fetch = require('js-easy-fetch')()
```
