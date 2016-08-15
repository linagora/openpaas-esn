'use strict';

var CONFIG_KEY = 'davserver';
var DEFAULT_DAV_SERVER = 'http://localhost:80';

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var davConfig = dependencies('esn-config')(CONFIG_KEY);

  function getDavEndpoint(user, callback) {
    if (!callback && typeof user === 'function') {
      callback = user;
      user = null;
    }

    davConfig.forUser(user).get().then(function(data) {
      if (data && data.backend && data.backend.url) {
        return callback(data.backend.url);
      }

      return callback(DEFAULT_DAV_SERVER);
    }, function(err) {
      logger.error('Error while getting DAV configuration, default configuration will be used:', err);
      callback(DEFAULT_DAV_SERVER);
    });
  }

  return {
    getDavEndpoint: getDavEndpoint
  };

};
