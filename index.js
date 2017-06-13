const path = require('path')
const fs = require('fs')
const globalLog = require('global-request-logger')
const intercept = require('intercept-stdout')

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
  const requests = []
  const projectDescriptor = module.exports.getProjectDescriptor(
    projectsDir,
    projectIdentifier
  )
  const logger = {
    logStatements: [],
    logRequest: function(res) {},
    log: function(str) {}
  }

  // Logging request made through node HTTP
  globalLog.initialize()
  globalLog.on('success', function(request, response) {
    requests.push({ status: 'success', request, response })
  })
  globalLog.on('error', function(request, response) {
    requests.push({ status: 'error', request, response })
  })

  // Logging STDOUT
  var stdout = ''
  var unhook_intercept = intercept(function(text) {
    stdout += text
  })

  const startTime = Date.now()

  try {
    testModule.testFunction(projectDescriptor, logger, function(err, res) {
      const response = responseFormat(startTime, requests, stdout, err, res)

      unhookGlobalListeners(globalLog, unhook_intercept)
      callback(null, response)
    })
  } catch (catchErr) {
    const response = responseFormat(startTime, requests, stdout, catchErr)
    unhookGlobalListeners(globalLog, unhook_intercept)
    callback(null, response)
  }
}

const responseFormat = function(startTime, requests, stdout, err, res) {
  const returnObj = {
    executedAt: new Date().toISOString(),
    duration: Date.now() - startTime,
    requests,
    stdout
  }

  if (err) {
    returnObj.ok = false
    returnObj.err = err
  } else {
    returnObj.ok = true
    returnObj.result = res
  }

  return returnObj
}

const unhookGlobalListeners = function(globalLog, unhook_intercept) {
  // Undo logging of STDOUT and HTTP
  unhook_intercept()
  globalLog.end()
}
