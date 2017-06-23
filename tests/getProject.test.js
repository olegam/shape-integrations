const test = require('tape')
const path = require('path')
const index = require('../index')
const Ajv = require('ajv')

const projectDir = path.resolve(__dirname)
const projectIdentifier = 'jsonplaceholder'

const schema = {
  type: 'object',
  properties: {},
  required: ['name', 'accessKey']
}

test('getProject simple', t => {
  t.plan(1)

  index.getProject(projectDir, projectIdentifier, (err, result) => {
    const validator = new Ajv()

    validator.validate(schema, result)
    t.equal(validator.errors, null)
  })
})

test('getProject with invalid path test', function(t) {
  t.plan(1)

  try {
    index.getProject('./', projectIdentifier, (err, result) => {
      t.equal(err.code, 'MODULE_NOT_FOUND')
    })
  } catch (err) {}
})
