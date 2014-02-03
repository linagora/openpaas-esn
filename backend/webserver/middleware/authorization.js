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
