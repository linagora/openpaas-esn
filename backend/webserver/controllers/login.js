'use strict';

var passport = require('passport');
var config = require('../../core').config('default');
var userlogin = require('../../core/user/login');
var logger = require('../../core/logger');

var login = function(req, res, next) {
  if (!req.body.username ||   !req.body.password) {
    return res.json(400, {
      error: {
        code: 400,
        message: 'Login error',
        details: 'Bad parameters, missing username and/or password'
      }
    });
  }

  var username = req.body.username;

  var strategies = config.auth && config.auth.strategies ? config.auth.strategies : ['local'];
  passport.authenticate(strategies, function(err, user, info) {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.json(404, {
        error: {
          code: 404,
          message: 'Login error',
          details: 'User not found'
        }
      });
    }

    req.logIn(user, function(err) {
      if (err) {
        userlogin.failure(username, function(err, data) {
          if (err) {
            logger.error('Problem while setting login failure for user ' + username, err);
          }
          return res.json(400, {
            error: {
              code: 400,
              message: 'Login error',
              details: err.message
            }
          });
        });
      }

      userlogin.success(username, function(err, user) {
        if (err) {
          logger.error('Problem while setting login success for user ' + username, err);
        }

        if (user && user.password) {
          user.password = undefined;
        }
        return res.json(200, user);
      });
    });
  })(req, res, next);
};
module.exports.login = login;

var user = function(req, res) {
  if (!req.user || !req.user.emails || !req.user.emails.length) {
    return res.send(500, {
      error: {
        code: 500,
        message: 'Internal error',
        details: 'User not set'
      }
    });
  }
  return res.json(200, req.user);
};
module.exports.user = user;


