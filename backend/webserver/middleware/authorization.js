'use strict';

//
// Authorization middleware
//

exports.requiresLogin = function(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  next();
};

exports.requiresAPILogin = function(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.json(401, {
      error: {
        code: 401,
        message: 'Login error',
        details: 'Please log in first'
      }
    });
  }
  next();
};

/**
 * Checks that the current request user is the current request domain manager
 *
 * @param {Requets} req
 * @param {Response} res
 * @param {Function} next
 */
exports.requiresDomainManager = function(req, res, next) {
  if (!req.user || !req.domain || !req.user._id || !req.domain.administrator) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user or domain'});
  }

  if (!req.domain.administrator.equals(req.user._id)) {
    return res.json(403, {error: 403, message: 'Forbidden', details: 'User is not the domain manager'});
  }
  next();
};
