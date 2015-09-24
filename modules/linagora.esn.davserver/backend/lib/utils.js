'use strict';

var CONFIG_KEY = 'davserver';
var DEFAULT_DAV_SERVER = 'http://localhost:80';

module.exports = function(dependencies) {

  var esnConfig = dependencies('esn-config');

  function getDavEndpoint(callback) {
    esnConfig(CONFIG_KEY).get(function(err, data) {
      if (err) {
        return callback(DEFAULT_DAV_SERVER);
      }

      if (data && data.backend && data.backend.url) {
        return callback(data.backend.url);
      }

      return callback(DEFAULT_DAV_SERVER);
    });
  }

  return {
    getDavEndpoint: getDavEndpoint
  };

};
