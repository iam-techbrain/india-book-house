// Standardized JSON response payload builder
function formatResponse({
  success = true,
  statusCode = 200,
  message = '',
  data = null,
  error = null,
  meta = null
}) {
  const payload = {
    success: Boolean(success),
    statusCode: Number(statusCode),
    message: message || (success ? 'Success' : 'An error occurred'),
    data: data !== undefined ? data : null,
    error: error ? (typeof error === 'object' && error.message ? error.message : String(error)) : null
  };

  if (meta && typeof meta === 'object') {
    payload.meta = meta;
  }

  return payload;
}

// Helper to return standardized success HTTP responses
function sendSuccess(res, data = null, message = 'Success', statusCode = 200, meta = null) {
  return res.status(statusCode).json(formatResponse({
    success: true,
    statusCode,
    message,
    data,
    error: null,
    meta
  }));
}

// Helper to return standardized error HTTP responses
function sendError(res, message = 'An error occurred', statusCode = 400, error = null, data = null, meta = null) {
  return res.status(statusCode).json(formatResponse({
    success: false,
    statusCode,
    message,
    data,
    error: error || message,
    meta
  }));
}

// Express middleware injecting res.sendSuccess and res.sendError on response object
function responseMiddleware(req, res, next) {
  res.sendSuccess = (data, message, statusCode, meta) => sendSuccess(res, data, message, statusCode, meta);
  res.sendError = (message, statusCode, error, data, meta) => sendError(res, message, statusCode, error, data, meta);
  next();
}

module.exports = {
  formatResponse,
  sendSuccess,
  sendError,
  responseMiddleware
};
