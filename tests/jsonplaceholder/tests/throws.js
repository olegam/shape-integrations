'use strict'

module.exports = {
  name: 'GET users',
  description: 'Fail testing getting the users',
  testFunction: function(context, callback) {
    throw new Error('test error')
  }
}
