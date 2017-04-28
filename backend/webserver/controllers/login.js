'use strict';

var passport = require('passport');
var url = require('url');
var config = require('../../core').config('default');
var userlogin = require('../../core/user/login');
var esnConfig = require('../../core/esn-config');
var logger = require('../../core/logger');
var alterTemplatePath = require('../middleware/templates').alterTemplatePath;
var assetRegistry = require('../../core').assets;

function index(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect(req.query.continue || '/');
  }

  esnConfig('recaptcha').get(function(err, recaptcha) {
    if (err) {
      logger.error('Could not get recaptcha keys in esn config.', err.message);

      return res.status(500).json({
        error: 500,
        message: 'Server Error',
        details: 'Internal server error'
      });
    }

    res.locals.assets = assetRegistry.envAwareApp('welcome');

    alterTemplatePath('welcome/index', function(tplPath) {
      res.render(tplPath, {
        title: 'Home',
        recaptchaPublicKey: recaptcha ? recaptcha.publickey : null
      });
    });
  });
}
module.exports.index = index;

var login = function(req, res, next) {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({
      recaptcha: req.recaptchaFlag || false,
      error: {
        code: 400,
        message: 'Login error',
        details: 'Bad parameters, missing username and/or password'
      }
    });
  }

  var username = req.body.username;

  var strategies = config.auth && config.auth.strategies ? config.auth.strategies : ['local'];
  passport.authenticate(strategies, function(err, user) {
    if (err) {
      return next(err);
    }

    if (!user) {
      userlogin.failure(username, function(err) {
        if (err) {
          logger.error('Problem while setting login failure for user ' + username, err);
        }
        return res.status(403).json({
          recaptcha: req.recaptchaFlag || false,
          error: {
            code: 403,
            message: 'Login error',
            details: 'Bad username or password'
          }
        });
      });
    } else {
      req.logIn(user, function(err) {
        if (err) {
          return next(err);
        }

        userlogin.success(username, function(err, user) {
          if (err) {
            logger.error('Problem while setting login success for user ' + username, err);
          }

          var result = {};
          if (user) {
            result = user.toObject();
            delete result.password;
          }
          return res.status(200).json(result);
        });
      });
    }
  })(req, res, next);
};
module.exports.login = login;

var passwordResetIndex = function(req, res) {
  alterTemplatePath('password-reset/index', function(tplPath) {
    return res.render(tplPath, {
      title: 'PasswordReset'
    });
  });
};
module.exports.passwordResetIndex = passwordResetIndex;

var user = function(req, res) {
  if (!req.user || !req.user.emails || !req.user.emails.length) {
    return res.status(500).send({
      error: {
        code: 500,
        message: 'Internal error',
        details: 'User not set'
      }
    });
  }
  return res.status(200).json(req.user);
};
module.exports.user = user;
