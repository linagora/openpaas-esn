'use strict';

var CONFIG_KEY = 'davserver';
var DEFAULT_DAV_SERVER = 'http://localhost:80';

module.exports = function(dependencies) {

  var esnConfig = dependencies('esn-config');
  var proxy = require('./proxy')(dependencies);

  function getTarget(callback) {
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

  function handle(path) {
    return function(req, res, next) {

      getTarget(function(endpoint) {
        var options = {endpoint: endpoint + '/' + path};

        if (req.query.graceperiod) {
          options.graceperiod = req.query.graceperiod;
          return proxy.grace(req, res, options);
        }

        return proxy.http(req, res, options);
      });
    };
  }

  return {
    handle: handle
  };

};
