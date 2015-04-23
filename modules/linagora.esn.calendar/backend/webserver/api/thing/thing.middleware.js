'use strict';

/**
 * This middleware is a passThrough one, it does nothing
 * @param req - http request object
 * @param res - http response object
 * @param next - callback to call next middleware
 */
function passThrough(dependencies, req, res, next) {
  var logger = dependencies('logger');
  logger.debug('passing through thing middleware, do nothing');
  next();
}

module.exports = function(dependencies) {
  return {
    passThrough: passThrough.bind(null, dependencies)
  };
};
