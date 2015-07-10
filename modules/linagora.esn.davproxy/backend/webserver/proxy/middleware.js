'use strict';

var GRACE_PERIOD = 10000;
var FACTOR = 2;

var CONFIG_KEY = 'davserver';
var DEFAULT_DAV_SERVER = 'http://localhost:80';

module.exports = function(dependencies) {

  var authToken = dependencies('auth').token;
  var esnConfig = dependencies('esn-config');
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

  function getDavEndpoint(req, res, next) {

    function defaultDav() {
      req.davserver = DEFAULT_DAV_SERVER;
      return next();
    }

    esnConfig(CONFIG_KEY).get(function(err, data) {
      if (err) {
        return defaultDav();
      }

      if (data && data.backend && data.backend.url) {
        req.davserver = data.backend.url;
        return next();
      }

      defaultDav();
    });
  }

  return {
    generateNewToken: generateNewToken,
    getDavEndpoint: getDavEndpoint
  };
};
