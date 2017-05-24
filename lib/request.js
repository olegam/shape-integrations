module.exports.successResponse = function(
  context,
  bodyObject,
  statusCode = 200
) {
  bodyObject.status = 'ok'
  const res = {
    statusCode: statusCode,
    body: JSON.stringify(bodyObject),
    headers: { 'Access-Control-Allow-Origin': '*' }
  }
  console.log('Successful request with response:', bodyObject)
  context.succeed(res)
}

module.exports.failureResponse = function(context, err, statusCode = 500) {
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

module.exports.accessValidation = function(
  password,
  masterPassword,
  projectPassword,
  cb
) {
  const projectPasswordIsFunc = typeof projectPassword === 'function'
  const callback = projectPasswordIsFunc ? projectPassword : cb

  if (password == undefined || password == '')
    return cb(new Error('password not defined'))

  const verifiedMasterPassword = masterPassword && password === masterPassword
  const verfiedProjectPassword =
    !projectPasswordIsFunc && projectPassword === password

  if (!password) {
    return callback(new Error('No Access'))
  }

  if (!verfiedProjectPassword && !verifiedMasterPassword) {
    return callback(new Error('No Access'))
  }

  if (verfiedProjectPassword || verifiedMasterPassword) {
    callback()
  }
}
