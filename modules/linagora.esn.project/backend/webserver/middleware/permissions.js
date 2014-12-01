'use strict';

module.exports = function(lib, deps) {
  return {
    userIsProjectCreator: function(req, res, next) {
      if (!req.user._id.equals(req.project.creator)) {
        return res.json(403, {error: 403, message: 'Forbidden', details: 'User is not the project creator'});
      }
      return next();
    }
  };
};
