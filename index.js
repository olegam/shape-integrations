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
  callback(null, tests)
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


const successResponse = function (context, bodyObject, statusCode = 200) {
  const res = {
    "statusCode":statusCode,
    "body": JSON.stringify(bodyObject)
  }
  context.succeed(res)
}

module.exports.makeLambdaHandlers = function(projectsDir) {
  const handlers = {
    lambdaGetAllProjects: function(event, context) {
      console.log(event)

      const path = event.path
      console.log('path:', path)

      module.exports.getAllProjects(projectsDir, function (err, projects) {
        if (err) return context.fail(err)
        successResponse(context, {projects: projects})
      })
    },
    lambdaGetProjectDetails: function(event, context) {
      console.log(event)

      const projectIdentifier = event.pathParameters.projectId.toLowerCase()
      console.log('projectId:', projectIdentifier)

      module.exports.getAllProjects(projectsDir, function (err, projects) {
        if (err) return context.fail(err)

        const project = projects.filter(p => p.identifier === projectIdentifier)[0]
        if (!project) return context.fail(new Error('Unknown  project identifier: ' + projectIdentifier))

        module.exports.getTestsForProject(projectsDir, projectIdentifier, function (err, tests) {
          if (err) return context.fail(err)
          project.tests = tests
          successResponse(context, project)
        })
      })
    },
    lambdaPostRunTest: function (event, context) {
      console.log(event)

      const projectIdentifier = event.pathParameters.projectId.toLowerCase()
      console.log('projectId:', projectIdentifier)
      const testIdentifier = event.pathParameters.testId
      console.log('testIdentifier:', testIdentifier)

      module.exports.runTest(projectsDir, projectIdentifier, testIdentifier, function (err, res) {
        if (err) return context.fail(err)
        successResponse(context, res, 201)
      })
    }
  }
  return handlers
}
