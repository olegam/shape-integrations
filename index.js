'use strict'

const fs = require('fs')
const path = require('path')

module.exports.getAllProjects = function(projectsDir, callback) {
  const getSubDirNames = p => fs.readdirSync(p).filter(f => fs.statSync(p+"/"+f).isDirectory())
  const projectIdentifiers = getSubDirNames(projectsDir)
  const projectDescriptors = projectIdentifiers.map(function(identifier) {
    const descriptorPath = path.resolve(projectsDir, identifier, 'project.json')
    let descriptor = require(descriptorPath)
    descriptor.identifier = identifier
    return descriptor
  })
  callback(null, projectDescriptors)
}

module.exports.getTestsForProject = function(projectsDir, projectIdentifier, callback) {
  const getFileNames = (dir, extension) => fs.readdirSync(dir).filter(f => f.endsWith(extension))
  const testsDir = path.resolve(projectsDir, projectIdentifier, 'tests')
  const testFiles = getFileNames(testsDir, '.js')
  const tests = testFiles.map(function (testName) {
    const testPath = path.resolve(testsDir, testName)
    const testModule = require(testPath)
    let test = {
      identifier: testName,
      name: testModule.name,
      description: testModule.description
    }

    return test
  })
  console.log(tests)
}

module.exports.runTest = function(projectsDir, projectIdentifier, testIdentifier, callback) {
  const testsDir = path.resolve(projectsDir, projectIdentifier, 'tests')
  const testPath = path.resolve(testsDir, testIdentifier)
  const testModule = require(testPath)
  const descriptorPath = path.resolve(projectsDir, projectIdentifier, 'project.json')
  let projectDescriptor = require(descriptorPath)

  testModule.testFunction(projectDescriptor, function(err, res) {
    callback(err, res)
  })
}

module.exports.makeLambdaHandler = function(projectsDir) {
  return function(event, context) {
    console.log(event)

    Integration.getAllProjects(projectsDir, function (err, projects) {
      let res = {
        "headers":{},
        "statusCode":200,
        "body": JSON.stringify({projects: projects})
      }
      context.succeed(res)
    })
  }
}
