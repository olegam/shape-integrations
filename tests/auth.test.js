const path = require('path')
const assert = require('assert')
const lambda = require('lambda-local')

describe('lambdaGetAllProjects', () => {
  describe('allAccessPassword', () => {
    it('should grant access', done => {
      process.env.ALL_ACCESS_PASSWORD = 'test123'
      lambda.execute({
        event: {
          pathParameters: {
            accessKey: 'test123'
          }
        },
        lambdaHandler: 'lambdaGetAllProjects',
        lambdaPath: path.join('lambda.js'),
        callback: function(err, data) {
          if (err) {
            assert.equal(err, false)
          } else {
            assert.equal(data.statusCode, 200)
          }
          done()
        }
      })
    })
  })
})

describe('lambdaGetProjectDetails', () => {
  describe('allAccessPassword', () => {
    it('should grant access', done => {
      process.env.ALL_ACCESS_PASSWORD = 'test123'
      lambda.execute({
        event: {
          pathParameters: {
            accessKey: 'test123',
            projectId: 'jsonplaceholder'
          }
        },
        lambdaHandler: 'lambdaGetProjectDetails',
        lambdaPath: path.join('lambda.js'),
        callback: function(err, data) {
          if (err) {
            assert.equal(err, false)
          } else {
            assert.equal(data.statusCode, 200)
          }
          done()
        }
      })
    })
  })

  describe('project specific password', () => {
    it('should grant access', done => {
      lambda.execute({
        event: {
          pathParameters: {
            accessKey: 'testjson',
            projectId: 'jsonplaceholder'
          }
        },
        lambdaHandler: 'lambdaGetProjectDetails',
        lambdaPath: path.join('lambda.js'),
        callback: function(err, data) {
          if (err) {
            assert.equal(err, false)
          } else {
            assert.equal(data.statusCode, 200)
          }
          done()
        }
      })
    })
  })
})

describe('lambdaPostRunTest', () => {
  describe('allAccessPassword', () => {
    it('should grant access', done => {
      process.env.ALL_ACCESS_PASSWORD = 'test123'
      lambda.execute({
        event: {
          pathParameters: {
            accessKey: 'test123',
            projectId: 'jsonplaceholder',
            testId: 'users'
          }
        },
        lambdaHandler: 'lambdaPostRunTest',
        lambdaPath: path.join('lambda.js'),
        callback: function(err, data) {
          if (err) {
            assert.equal(err, false)
          } else {
            assert.equal(data.statusCode, 200)
          }
          done()
        }
      })
    })
  })

  describe('project specific password', () => {
    it('should grant access', done => {
      lambda.execute({
        event: {
          pathParameters: {
            accessKey: 'test123',
            projectId: 'jsonplaceholder',
            testId: 'users'
          }
        },
        lambdaHandler: 'lambdaPostRunTest',
        lambdaPath: path.join('lambda.js'),
        callback: function(err, data) {
          if (err) {
            assert.equal(err, false)
          } else {
            assert.equal(data.statusCode, 200)
          }
          done()
        }
      })
    })
  })
})
