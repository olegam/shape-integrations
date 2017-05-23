'use strict'

const fs = require('fs')
const path = require('path')
const aws = require('aws-sdk')
const s3 = new aws.S3()

const accessValidation = function(accessKey, specificPassword, cb) {
  const allAccessPassword = process.env.ALL_ACCESS_PASSWORD

  const callback = typeof specificPassword === 'function'
    ? specificPassword
    : cb

  const notEqualToSpecificPassword =
    allAccessPassword && accessKey !== allAccessPassword
  const notEqualToAllAccessPassword = specificPassword !== accessKey

  if (!accessKey || notEqualToSpecificPassword || notEqualToAllAccessPassword) {
    callback(new Error('No Access'))
  }
}

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
  console.log(tests)
  callback(null, tests)
}

module.exports.runTest = function(
  projectsDir,
  projectIdentifier,
  testIdentifier,
  accessKey,
  callback
) {
  const testsDir = path.resolve(projectsDir, projectIdentifier, 'tests')
  const testPath = path.resolve(testsDir, testIdentifier)
  const testModule = require(testPath)
  const descriptorPath = path.resolve(
    projectsDir,
    projectIdentifier,
    'project.json'
  )
  let projectDescriptor = require(descriptorPath)

  // Access Control
  accessValidation(accessKey, projectDescriptor.accessKey, function(err) {
    callback(new Error('Access denied'))
    return
  })

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

const successResponse = function(context, bodyObject, statusCode = 200) {
  bodyObject.status = 'ok'
  const res = {
    statusCode: statusCode,
    body: JSON.stringify(bodyObject),
    headers: { 'Access-Control-Allow-Origin': '*' }
  }
  console.log('Successful request with response:', bodyObject)
  context.succeed(res)
}

const failureResponse = function(context, err, statusCode = 500) {
  const body = {
    status: 'error',
    err: err.message || {}
  }
  const res = {
    statusCode: statusCode,
    body: JSON.stringify(body)
  }
  console.log('Failing request with error:', err)
  context.succeed(res)
}

module.exports.makeLambdaHandlers = function(projectsDir) {
  const handlers = {
    lambdaGetAllProjects: function(event, context) {
      const accessKey = event.accessKey

      accessValidation(event.accessKey, function(err) {
        if (err) {
          failureResponse(context, new Error('Access denied'))
          return
        }
      })

      const path = event.path
      console.log('path:', path)

      module.exports.getAllProjects(projectsDir, function(err, projects) {
        if (err) return failureResponse(context, err)
        successResponse(context, { projects: projects })
      })
    },
    lambdaGetProjectDetails: function(event, context) {
      console.log(event)

      const pathParameters = event.pathParameters || { projectId: '' }
      const projectIdentifier = pathParameters.projectId.toLowerCase()
      console.log('projectId:', projectIdentifier)

      accessValidation(event.pathParameters.accessKey, function(err) {
        if (err) {
          failureResponse(context, new Error('Access denied'))
          return
        }
      })

      module.exports.getAllProjects(projectsDir, accessKey, function(
        err,
        projects
      ) {
        if (err) return failureResponse(context, err)

        const project = projects.filter(
          p => p.identifier === projectIdentifier
        )[0]
        if (!project)
          return failureResponse(
            context,
            new Error('Unknown  project identifier: ' + projectIdentifier),
            400
          )

        module.exports.getTestsForProject(
          projectsDir,
          projectIdentifier,
          function(err, tests) {
            if (err) return failureResponse(context, err)
            project.tests = tests
            successResponse(context, project)
          }
        )
      })
    },
    lambdaPostRunTest: function(event, context) {
      console.log(event)
      console.log(process.env)

      let pathParameters = event.pathParameters || {
        projectId: '',
        testId: ''
      }
      const projectIdentifier = pathParameters.projectId.toLowerCase()
      console.log('projectId:', projectIdentifier)
      const testIdentifier = pathParameters.testId
      console.log('testIdentifier:', testIdentifier)
      const accessKey = pathParameters.accessKey

      const testResultsBucket = process.env.TEST_RESULTS_BUCKET

      module.exports.runTest(
        projectsDir,
        projectIdentifier,
        testIdentifier,
        accessKey,
        function(err, res) {
          if (err) return failureResponse(context, err)

          const resultFolder = projectIdentifier + '/' + testIdentifier + '/'
          const resultPath = resultFolder + Date.now() + '-result.json'
          const resultLatestPath = resultFolder + 'latest-result.json'

          const saveToBucket = function(path, callback) {
            if (process.env.LOCAL) {
              console.log(res)
              callback(null)
            } else {
              s3.putObject(
                {
                  Bucket: testResultsBucket,
                  Key: path,
                  Body: JSON.stringify(res)
                },
                callback
              )
            }
          }

          saveToBucket(resultPath, function(err, putRes) {
            if (err) return failureResponse(context, err)
            saveToBucket(resultLatestPath, function(err, putRes) {
              if (err) return failureResponse(context, err)
              successResponse(context, res, 201)
            })
          })
        }
      )
    }
  }
  return handlers
}
