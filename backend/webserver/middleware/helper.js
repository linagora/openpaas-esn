'use strict';

module.exports = {
  requireBodyAsArray
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
