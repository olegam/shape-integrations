const globalLog = require('global-request-logger')

process.on('message', opt => {
  let testModule

  try {
    testModule = require(opt.testPath)
  } catch (err) {
    return disconnectMessage(err)
  }

  const testFunction = testModule.testFunction
  const projectDescriptor = opt.descriptor
  const requests = []

  // Logging request made through node HTTP
  globalLog.initialize()
  globalLog.on('success', function(request, response) {
    requests.push({ status: 'success', request, response })
  })
  globalLog.on('error', function(request, response) {
    requests.push({ status: 'error', request, response })
  })

  const startTime = Date.now()
  let response = {}

  try {
    testFunction(projectDescriptor, function(err, res) {
      response = responseFormat(startTime, requests, testFunction, err, res)
      globalLog.end()
      disconnectMessage(null, response)
    })
  } catch (catchErr) {
    response = responseFormat(startTime, requests, testFunction, catchErr)
    globalLog.end()
    disconnectMessage(null, response)
  }
})

const disconnectMessage = function(err, result) {
  process.send({ err, result }, () => {
    process.disconnect()
  })
}

const responseFormat = function(startTime, requests, func, err, res) {
  const returnObj = {
    executedAt: new Date().toISOString(),
    duration: Date.now() - startTime,
    requests,
    code: func.toString(),
    ok: true,
    result: res
  }

  if (err) {
    returnObj.ok = false
    returnObj.err = err
  }

  return returnObj
}
