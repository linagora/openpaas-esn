'use strict';

var GRACE_PERIOD = 10000;
var FACTOR = 2;

module.exports = function(dependencies) {

  var authToken = dependencies('auth').token;
  var logger = dependencies('logger');

  function generateNewToken(req, res, next) {
    var ttl = req.query.graceperiod ? req.query.graceperiod * FACTOR : GRACE_PERIOD;
    authToken.getNewToken({ttl: ttl, user: req.user._id}, function(err, token) {
      if (err || !token) {
        if (err) {
          logger.error('Can not generate new token', err);
        }
        return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Can not generate token'}});
      }

      req.token = token;
      next();
    });
  }

  return {
    generateNewToken: generateNewToken
  };
};
