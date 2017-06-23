const test = require('tape')
const path = require('path')
const index = require('../index')
const Ajv = require('ajv')

const projectDir = path.resolve(__dirname)
const projectIdentifier = 'jsonplaceholder'
const passed = 'success_users'
const failed = 'failed_users'
const throws = 'throws'

const schema = {
  type: 'object',
  properties: {
    ok: {
      type: 'boolean'
    },
    duration: {
      type: 'number'
    },
    requests: {
      type: 'array',
      items: {
        required: ['request', 'response', 'status']
      }
    },
    stdout: {
      type: 'string'
    },
    code: {
      type: 'string'
    }
  },
  required: ['ok', 'duration', 'requests', 'executedAt', 'code'],
  oneOf: [
    { required: ['err'], type: 'object' },
    { required: ['result'], type: 'object' }
  ]
}

const responseValidator = function(response) {
  const ajv = new Ajv()
  ajv.validate(schema, response)
  return ajv.errors
}

test('run passed test', function(t) {
  t.plan(1)

  index.runTest(projectDir, projectIdentifier, passed, (err, result) => {
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
    validator.validate(schema, result)
    t.equal(validator.errors, null)
  })
})

test('run failed test', function(t) {
  t.plan(2)

  index.runTest(projectDir, projectIdentifier, failed, (err, result) => {
    t.equal(responseValidator(result), null)
    t.equal(result.ok, false)
  })
})

test('run crashed test', function(t) {
  t.plan(1)

  index.runTest(projectDir, projectIdentifier, throws, (err, result) => {
    t.equal(responseValidator(result), null)
  })
})

test('run invalid project path', t => {
  t.plan(1)

  index.runTest('./', projectIdentifier, passed, (err, result) => {
    t.equal(err.code, 'MODULE_NOT_FOUND')
  })
})

test('run invalid test identifier', t => {
  t.plan(1)

  index.runTest(projectDir, 'asd', passed, (err, result) => {
    t.equal(err.code, 'MODULE_NOT_FOUND')
  })
})
