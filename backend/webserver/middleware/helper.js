const _ = require('lodash');
const dbHelper = require('../../helpers').db;

module.exports = {
  requireBodyAsArray,
  requireBody,
  requireInQuery,
  checkIdInParams
};

function requireBodyAsArray(req, res, next) {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: 'body should be an array'
      }
    });
  }

  next();
}

function requireBody(req, res, next) {
  if (_.isUndefined(req.body)) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: 'body is required'
      }
    });
  }

  next();
}

function requireInQuery(queries, customMessage) {
  queries = Array.isArray(queries) ? queries : [queries];

  return (req, res, next) => {
    const missingQueries = queries.filter(query => _.isUndefined(req.query[query]));

    if (missingQueries.length > 0) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad Request',
          details: customMessage || `missing ${missingQueries.join(', ')} in query`
        }
      });
    }

    next();
  };
}

/**
 * Middleware to check if value of ID in route parameters is valid.
 * Return 404 HTTP code and message if ID is invalid. Otherwise, go to next middleware.
 *
 * @param  {String} idKey         Key of ID in req.params object.
 * @param  {String} modelName     Database model name. Just used for response message.
 * @param  {String} customMessage Response message when ID is invalid.
 */
function checkIdInParams(idKey, modelName, customMessage) {
  return (req, res, next) => {
    if (!dbHelper.isValidObjectId(req.params[idKey])) {
      return res.status(404).json({
        error: {
          code: 404,
          message: 'Not Found',
          details: customMessage || `${modelName} not found`
        }
      });
    }

    next();
  };
}
