const _ = require('lodash');

module.exports = {
  requireBodyAsArray,
  requireBody
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
