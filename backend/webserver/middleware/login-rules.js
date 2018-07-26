'use strict';

var userlogin = require('../../core/user/login');
var userModule = require('../../core/user');
var logger = require('../../core/logger');
const { USER_ACTIONS } = require('../../core/user/constants');

function userError(req, res, err) {
  logger.error('Error while searching user ' + req.body.username, err.message);
  res.status(500).json({error: {status: 500, message: 'Server Error', details: 'Internal server error'}});
}

module.exports.checkLoginCount = function(req, res, next) {
  var username = req.body.username;

  if (!username) {
    return next();
  }

  userModule.findByEmail(username, function(err, user) {
    if (err) {
      return userError(req, res, err);
    }

    if (!user) {
      next();
    } else {
      userlogin.canLogin(username, function(err, status) {
        if (err) {
          logger.error('Error while checking user ' + username + ' login count', err.message);
          return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Internal server error'}});
        } else {
          if (!status) {
            req.recaptchaFlag = true;
          }
          next();
        }
      });
    }
  });
};

function checkDisabled(req, res, next) {
  var username = req.body.username;

  if (!username) {
    return next();
  }

  userModule.findByEmail(username, function(err, user) {
    if (err) {
      return userError(req, res, err);
    }

    if (!user) {
      return next();
    }

    if (!userModule.states.isEnabled(user, USER_ACTIONS.login)) {
      return res.status(403).json({error: {code: 403, message: 'Forbidden', details: 'The specified account is disabled'}});
    }

    next();
  });
}
module.exports.checkDisabled = checkDisabled;
