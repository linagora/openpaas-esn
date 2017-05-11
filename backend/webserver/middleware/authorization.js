'use strict';

var passport = require('passport');
var config = require('../../core').config('default');
var userModule = require('../../core/user');
var domainModule = require('../../core/domain');

//
// Authorization middleware
//

exports.loginAndContinue = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.redirect('/login?continue=' + encodeURIComponent(req.originalUrl));
};

exports.requiresLogin = function(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  next();
};

exports.requiresAPILogin = _requiresAPILoginAndFailWithError();
exports.requiresAPILoginAndFailWithError = _requiresAPILoginAndFailWithError(true);

function _requiresAPILoginAndFailWithError(failWithError = false) {
  return (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }

    if (config.auth && config.auth.apiStrategies) {
      return passport.authenticate(config.auth.apiStrategies, { session: false, failWithError: failWithError })(req, res, next);
    }

    res.set('Content-Type', 'application/json; charset=utf-8');

    return res.status(401).json({
      error: {
        code: 401,
        message: 'Login error',
        details: 'Please log in first'
      }
    });
  };
}

/**
 * Checks that the current request user is the current request domain manager
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
exports.requiresDomainManager = function(req, res, next) {
  if (!req.user || !req.domain || !req.user._id) {
    return res.status(400).json({error: 400, message: 'Bad request', details: 'Missing user or domain'});
  }

  domainModule.userIsDomainAdministrator(req.user, req.domain, function(err, isDomainAdministrator) {
    if (err) {
      return res.status(500).json({
        error: {
          status: 500, message: 'Server Error', details: err.message
        }
      });
    }

    if (isDomainAdministrator) {
      return next();
    }

    return res.status(403).json({error: 403, message: 'Forbidden', details: 'User is not the domain manager'});
  });
};

module.exports.requiresDomainMember = function(req, res, next) {
  if (!req.user || !req.domain) {
    return res.status(400).json({error: 400, message: 'Bad request', details: 'Missing user or domain'});
  }

  domainModule.userIsDomainMember(req.user, req.domain, function(err, isDomainMember) {
    if (err) {
      return res.status(500).json({
        error: {
          status: 500, message: 'Server Error', details: err.message
        }
      });
    }

    if (isDomainMember) {
      return next();
    }

    return res.status(403).json({error: 403, message: 'Forbidden', details: 'User does not belongs to the domain'});
  });
};

exports.requiresCommunityCreator = function(req, res, next) {
  if (!req.community) {
    return res.status(400).json({error: 400, message: 'Bad request', details: 'Missing community'});
  }

  if (!req.user) {
    return res.status(400).json({error: 400, message: 'Bad request', details: 'Missing user'});
  }

  if (!req.community.creator.equals(req.user._id)) {
    return res.status(403).json({error: 403, message: 'Forbidden', details: 'User is not the community creator'});
  }
  next();
};

exports.requiresJWT = function(req, res, next) {
  return passport.authenticate('jwt', {session: false})(req, res, next);
};

exports.decodeJWTandLoadUser = function(req, res, next) {
  var payload = req.user;

  if (!payload.email) {
    return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'Email is required'}});
  }

  userModule.findByEmail(payload.email, function(err, user) {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Internal Server Error', details: 'Error while searching for the user'}});
    }
    if (!user) {
      return res.status(404).json({error: {code: 404, message: 'Not Found', details: 'Email is not valid.'}});
    }
    req.user = user;

    return next();
  });
};
