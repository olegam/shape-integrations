'use strict'

const path = require('path')
const Integration = require('./')

const projectsDir = path.resolve(__dirname, 'tests', 'projects')

const lambdaHandlers = Integration.makeLambdaHandlers(projectsDir)

Object.assign(module.exports, lambdaHandlers)
