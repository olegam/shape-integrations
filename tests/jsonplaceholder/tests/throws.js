'use strict'

const request = require('superagent')
const Ajv = require('ajv')

module.exports = {
  name: 'GET users',
  description: 'Fail testing getting the users',
  testFunction: function(context, logger, callback) {
    throw new Error('test error')
  }
}
