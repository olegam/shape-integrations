const test = require('tape')
const path = require('path')
const index = require('../index')
const Ajv = require('ajv')

const projectDir = path.resolve(__dirname)
const projectIdentifier = 'jsonplaceholder'

const schema = {
  type: 'array',
  items: {
    required: ['identifier', 'name', 'description']
  }
}

const responseValidator = function(response) {
  const ajv = new Ajv()
  ajv.validate(schema, response)
  return ajv.errors
}

test('getAllProjects', function(t) {
  t.plan(1)

  index.getTestsForProject(projectDir, projectIdentifier, (err, result) => {
    const validator = new Ajv()

    validator.validate(schema, result)
    t.equal(validator.errors, null)
  })
})

test('getAllProjects with invalid project path', function(t) {
  t.plan(1)

  index.getTestsForProject('./', 'asdasd', (err, result) => {
    t.equal(err.code, 'ENOENT')
  })
})

test('getAllProjects with invalid path test', function(t) {
  t.plan(1)

  index.getTestsForProject(projectDir, 'asdasd', (err, result) => {
    t.equal(err.code, 'ENOENT')
  })
})
