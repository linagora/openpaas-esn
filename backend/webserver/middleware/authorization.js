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
