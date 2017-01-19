'use strict';

module.exports = function() {
  return {
    userIsProjectCreator: function(req, res, next) {
      if (!req.user._id.equals(req.project.creator)) {
        return res.status(403).json({error: 403, message: 'Forbidden', details: 'User is not the project creator'});
      }
      return next();
    }
  };
};
