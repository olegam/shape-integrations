'use strict'

const fs = require('fs')
const path = require('path')
const aws = require('aws-sdk')
const s3 = new aws.S3()

const projecthelper = require('./lib/project')
const request = require('./lib/request')
const successResponse = request.successResponse
const failureResponse = request.failureResponse
const accessValidation = request.accessValidation

module.exports.makeLambdaHandlers = function(projectsDir) {
  const handlers = {
    lambdaGetAllProjects: function(event, context) {
      const accessKey = (event.pathParameters || {}).accessKey

      const path = event.path
      console.log('path:', path)

      projecthelper.getAllProjects(projectsDir, function(err, projects) {
        if (err) return failureResponse(context, err)
        successResponse(context, { projects: projects })
      })
    },
    lambdaGetProjectDetails: function(event, context) {
      const pathParameters = event.pathParameters || { projectId: '' }
      const projectIdentifier = pathParameters.projectId.toLowerCase()
      console.log('projectId:', projectIdentifier)

      // accessValidation(event.pathParameters.accessKey, function(err) {
      //   if (err) {
      //     failureResponse(context, new Error('Access denied'))
      //     return
      //   }
      // })

      projecthelper.getProject(projectsDir, projectIdentifier, function(
        err,
        project
      ) {
        if (err) return failureResponse(context, err)
        if (!project)
          return failureResponse(
            context,
            new Error('Unknown project identifier: ' + projectIdentifier),
            400
          )

        projecthelper.getTestsForProject(
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
      const pathParameters = event.pathParameters || {
        projectId: '',
        testId: ''
      }
      const projectIdentifier = pathParameters.projectId.toLowerCase()
      console.log('projectId:', projectIdentifier)
      const testIdentifier = pathParameters.testId
      console.log('testIdentifier:', testIdentifier)
      const accessKey = pathParameters.accessKey

      const testResultsBucket = process.env.TEST_RESULTS_BUCKET

      projecthelper.runTest(
        projectsDir,
        projectIdentifier,
        testIdentifier,
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
