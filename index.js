const path = require('path')
const fs = require('fs')
const fork = require('child_process').fork

module.exports.getAllProjects = function(projectsDir, callback) {
  const getSubDirNames = p =>
    fs.readdirSync(p).filter(f => fs.statSync(p + '/' + f).isDirectory())
  const projectIdentifiers = getSubDirNames(projectsDir)

  try {
    const projectDescriptors = projectIdentifiers.map(function(identifier) {
      const descriptorPath = path.resolve(
        projectsDir,
        identifier,
        'project.json'
      )

      descriptor = require(descriptorPath)
      descriptor.identifier = identifier
      return descriptor
    })

    callback(null, projectDescriptors)
  } catch (err) {
    return callback(err)
  }
}

module.exports.getProject = function(projectsDir, projectIdentifier, callback) {
  module.exports.getAllProjects(projectsDir, function(err, projects) {
    if (err) return callback(err)

    const project = projects.filter(p => {
      return p.identifier === projectIdentifier
    })[0]

    callback(null, project)
  })
}

module.exports.getTestsForProject = function(
  projectsDir,
  projectIdentifier,
  callback
) {
  try {
    const getFileNames = (dir, extension) =>
      fs.readdirSync(dir).filter(f => f.endsWith(extension))
    const testsDir = path.resolve(projectsDir, projectIdentifier, 'tests')
    const testFiles = getFileNames(testsDir, '.js')

    const tests = testFiles.map(function(testName) {
      const testPath = path.resolve(testsDir, testName)
      const testModule = require(testPath)
      let test = {
        identifier: testName,
        name: testModule.name,
        description: testModule.description
      }

      return test
    })

    callback(null, tests)
  } catch (err) {
    callback(err)
  }
}

module.exports.getProjectDescriptor = function(
  projecstDir,
  projectIdentifier,
  callback
) {
  const descriptorPath = path.resolve(
    projecstDir,
    projectIdentifier,
    'project.json'
  )
  try {
    callback(null, require(descriptorPath))
  } catch (err) {
    callback(err)
  }
}

module.exports.runTest = function(
  projectsDir,
  projectIdentifier,
  testIdentifier,
  callback
) {
  const testsDir = path.resolve(projectsDir, projectIdentifier, 'tests')
  const testPath = path.resolve(testsDir, testIdentifier)
  const projectDescriptor = module.exports.getProjectDescriptor(
    projectsDir,
    projectIdentifier,
    function(err, descriptor) {
      if (err) return callback(err)
      const executor = fork(`${__dirname}/test_runner.js`)

      executor.send({
        descriptor,
        testPath
      })

      executor.on('message', res => {
        callback(res.err, res.result)
      })
    }
  )
}
