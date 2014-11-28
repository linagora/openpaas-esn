'use strict';

module.exports = function(lib, deps) {
  return {
    canAddMember: function(req, res, next) {
      return next();
    }
  };
};
