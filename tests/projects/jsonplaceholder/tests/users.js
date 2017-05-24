'use strict'

const request = require('superagent')
const Ajv = require('ajv')

module.exports = {
  name: 'GET users',
  description: 'Tests getting the users',
  testFunction: function(context, logger, callback) {
    request
      .get('https://jsonplaceholder.typicode.com/users')
      .end(function(err, res) {
        if (err) return callback(err, { ok: false, err: err })
        if (!res.ok) return callback(null, { ok: false, err: res })

        const validator = new Ajv()
        const schema = {
          properties: {
            statusCode: {
              type: 'integer',
              minimum: 200,
              maximum: 200
            },
            body: {
              type: 'array'
            }
          }
        }
        if (validator.validate(schema, res)) return callback(null, { ok: true })

        callback(null, { ok: false, err: validator.errors })
      })
  }
}
