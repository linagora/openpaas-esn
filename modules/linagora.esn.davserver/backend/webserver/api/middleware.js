'use strict';

var CONFIG_KEY = 'davserver';
var DEFAULT_DAV_SERVER = 'http://localhost:80';

module.exports = function(dependencies) {

  var esnConfig = dependencies('esn-config');

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
    getDavEndpoint: getDavEndpoint
  };

};
