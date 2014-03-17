'use strict';

var userlogin = require('../../core/user/login');
var logger = require('../../core/logger');

module.exports.checkLoginCount = function(req, res, next) {
  if (req.body.username) {
    userlogin.canLogin(req.body.username, function(err, status) {
      if (err) {
        logger.error('Error while checking user ' + req.body.username + ' login count', err.message);
        return res.json(500, {
          error: 500,
          message: 'Server Error',
          details: 'Internal server error'
        });
      } else {
        if (!status) {
          req.recaptchaFlag = true;
        }
        next();
      }
    });
  } else {
    next();
  }
};
