'use strict';

module.exports = function(dependencies) {

  var proxy = require('./proxy')(dependencies);

  return function(path) {

    function handle(options) {

      options = options || {};
      options.path = path;

      return function(req, res) {
        options.endpoint = req.davserver;

        if (req.query.graceperiod) {
          options.graceperiod = req.query.graceperiod;
          return proxy.grace(req, res, options);
        }

        if (req.token && req.token.token) {
          req.headers.ESNToken = req.token.token;
        }

        return proxy.http(req, res, options);
      };
    }

    return {
      handle: handle
    };
  };
};
