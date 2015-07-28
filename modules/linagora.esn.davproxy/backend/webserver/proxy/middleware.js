'use strict';

var GRACE_PERIOD = 10000;
var FACTOR = 2;

module.exports = function(dependencies) {

  var tokenMW = dependencies('tokenMW');

  function generateNewToken(req, res, next) {
    return tokenMW.generateNewToken(req.query.graceperiod ? req.query.graceperiod * FACTOR : GRACE_PERIOD)(req, res, next);
  }

  return {
    generateNewToken: generateNewToken
  };
};
