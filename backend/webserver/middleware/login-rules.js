'use strict';

var userlogin = require('../../core/user/login');
var logger = require('../../core/logger');

module.exports.checkLoginCount = function(req, res, next) {
  if (req.body.username) {
    userlogin.canLogin(req.body.username, function(err, status) {
      if (err) {
        logger.error('Error while checking user ' + req.body.username + '  login count', err);
        return res.json(500, {
          error: 500,
          message: 'Server Error',
          details: ''
        });
      }

      if (!status) {
        return res.json(403, {
          error: {
            code: 403,
            message: 'Login rejected',
            details: 'Too many attempts'
          }
        });
      }
    });
  }
  next();
};
