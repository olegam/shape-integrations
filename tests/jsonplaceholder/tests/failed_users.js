'use strict'

const request = require('superagent')
const Ajv = require('ajv')

module.exports = {
  name: 'GET users',
  description: 'Fail testing getting the users',
  testFunction: function(context, callback) {
    request
      .get('https://jsonplaceholder.typicode.com/userss')
      .end(function(err, res) {
        if (err) return callback(err)
        if (!res.ok) return callback(null, res)

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
        validator.validate(schema, res)
        callback(validator.errors, res)
      })
  }
}
