const path = require('path')
const fs = require('fs')

module.exports.getAllProjects = function(projectsDir, callback) {
  const getSubDirNames = p =>
    fs.readdirSync(p).filter(f => fs.statSync(p + '/' + f).isDirectory())
  const projectIdentifiers = getSubDirNames(projectsDir)
  const projectDescriptors = projectIdentifiers.map(function(identifier) {
    const descriptorPath = path.resolve(projectsDir, identifier, 'project.json')
    let descriptor = require(descriptorPath)
    descriptor.identifier = identifier
    return descriptor
  })

  callback(null, projectDescriptors)
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
}

module.exports.getProjectDescriptor = function(projecstDir, projectIdentifier) {
  const descriptorPath = path.resolve(
    projecstDir,
    projectIdentifier,
    'project.json'
  )
  return require(descriptorPath)
}

module.exports.runTest = function(
  projectsDir,
  projectIdentifier,
  testIdentifier,
  callback
) {
  const testsDir = path.resolve(projectsDir, projectIdentifier, 'tests')
  const testPath = path.resolve(testsDir, testIdentifier)
  const testModule = require(testPath)
  const projectDescriptor = module.exports.getProjectDescriptor(
    projectsDir,
    projectIdentifier
  )
  const logger = {
    logStatements: [],
    logRequest: function(res) {},
    log: function(str) {}
  }
  const startTime = Date.now()
  testModule.testFunction(projectDescriptor, logger, function(err, res) {
    res.duration = Date.now() - startTime
    callback(err, res)
  })
}
