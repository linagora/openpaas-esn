'use strict';

var DEFAULT_TIMEOUT = 20000;

var authToken = require('../../core/auth/token');
var logger = require('../../core/logger');

module.exports.generateNewToken = function(ttl) {

return function(req, res, next) {
    authToken.getNewToken({ttl: ttl || DEFAULT_TIMEOUT, user: req.user._id}, function(err, token) {
      if (err || !token) {
        if (err) {
          logger.error('Can not generate new token', err);
        }

return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Can not generate token'}});
      }

      req.token = token;
      next();
    });
  };
};
module.exports.generateUnexpiredToken = function() {

  return function(req, res, next) {

      authToken.getUnexpiredToken({ user: req.user._id}, function(err, token) {
        if (err || !token) {
          if (err) {
            logger.error('Can not generate a long-lived  token', err);
          }

  return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Can not generate a long-lived token'}});
        }

        req.token = token;
        next();
      });
    };
  };

function getToken(req, res, next) {
  if (!req.params.token) {
    return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'Can not retrieve token'}});
  }

  authToken.getToken(req.params.token, function(err, token) {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Can not get token'}});
    }

    if (!token) {
      return res.status(404).json({error: {code: 404, message: 'Not found', details: 'Token not found or expired'}});
    }

    req.token = token;
    next();
  });
}
module.exports.getToken = getToken;
