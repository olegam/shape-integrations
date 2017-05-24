const path = require('path')
const assert = require('assert')
const lambda = require('lambda-local')
const request = require('../lib/request')

const lambdaExecute = function(func, params, cb) {
  lambda.execute({
    event: {
      pathParameters: params
    },
    lambdaHandler: func,
    lambdaPath: path.join('lambda.js'),
    callback: function(err, data) {
      if (err) {
        return assert.equal(err, false)
      }

      cb(null, data)
    }
  })
}

describe('lambda functions', () => {
  beforeEach(() => {
    delete process.env.ALL_ACCESS_PASSWORD
  })

  describe('lambdaGetAllProjects', () => {
    it('allAccessPassword should grant access', done => {
      process.env.ALL_ACCESS_PASSWORD = 'test1'

      const params = {
        accessKey: 'test1'
      }

      lambdaExecute('lambdaGetAllProjects', params, function(err, data) {
        assert.equal(data.statusCode, 200)
        done()
      })
    })
  })

  describe('lambdaGetProjectDetails', () => {
    it('allAccessPassword should grant access', done => {
      process.env.ALL_ACCESS_PASSWORD = 'test12'

      const params = {
        accessKey: 'test12',
        projectId: 'jsonplaceholder'
      }

      lambdaExecute('lambdaGetProjectDetails', params, function(err, data) {
        assert.equal(data.statusCode, 200)
        done()
      })
    })

    it('project specific password should grant access', done => {
      const params = {
        accessKey: 'testjson',
        projectId: 'jsonplaceholder'
      }

      lambdaExecute('lambdaGetProjectDetails', params, function(err, data) {
        assert.equal(data.statusCode, 200)
        done()
      })
    })

    it('should fail if none is set', done => {
      lambdaExecute(
        'lambdaGetProjectDetails',
        {
          projectId: 'jsonplaceholder'
        },
        function(err, data) {
          assert.equal(data.statusCode, 500)
          done()
        }
      )
    })
  })

  describe('lambdaPostRunTest', () => {
    it('allAccessPassword should grant access', done => {
      process.env.ALL_ACCESS_PASSWORD = 'test1234'

      const params = {
        accessKey: 'test1234',
        projectId: 'jsonplaceholder',
        testId: 'users'
      }

      lambdaExecute('lambdaPostRunTest', params, function(err, data) {
        assert.equal(data.statusCode, 201)
        done()
      })
    })

    it('project specific password should grant access', done => {
      const params = {
        accessKey: 'testjson',
        projectId: 'jsonplaceholder',
        testId: 'users'
      }

      lambdaExecute('lambdaPostRunTest', params, function(err, data) {
        assert.equal(data.statusCode, 201)
        done()
      })
    })

    it('should fail if none is set', done => {
      lambdaExecute(
        'lambdaPostRunTest',
        {
          projectId: 'jsonplaceholder',
          testId: 'users'
        },
        function(err, data) {
          assert.equal(data.statusCode, 500)
          done()
        }
      )
    })
  })

  describe('accessValidation', () => {
    it('should validate master password', done => {
      request.accessValidation('123', '123', function(err) {
        assert.equal(err, undefined)
        done()
      })
    })

    it('should validate project password', done => {
      request.accessValidation('1234', '123', '1234', function(err) {
        assert.equal(err, undefined)
        done()
      })
    })

    it('should validate project and master password', done => {
      request.accessValidation('1234', '1234', '1234', function(err) {
        assert.equal(err, undefined)
        done()
      })
    })

    it('should not validate invalid master password', done => {
      request.accessValidation('1234', '123', function(err) {
        assert.throws(() => {
          throw new Error('No Access')
        })
        done()
      })
    })

    it('should not validate invalid project password', done => {
      request.accessValidation('1234', '', '123', function(err) {
        assert.throws(() => {
          throw new Error('No Access')
        })
        done()
      })
    })

    it('should not validate empty password', done => {
      request.accessValidation('', '', '', function(err) {
        assert.throws(() => {
          throw new Error('password not defined')
        })
        done()
      })
    })
  })
})
