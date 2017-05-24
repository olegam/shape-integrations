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

module.exports.accessValidation = function(accessKey, specificPassword, cb) {
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
