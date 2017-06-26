const _ = require('lodash');

module.exports = {
  requireBodyAsArray,
  requireBody,
  requireInQuery
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
