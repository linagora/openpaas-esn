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
        return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Can not generate token'}});
      }

      req.token = token;
      next();
    });
  };
};
