'use strict';

var httpproxy = require('express-http-proxy');

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var graceperiod = require('./graceperiod')(dependencies);

  function http(req, res, options) {

    httpproxy(options.endpoint, {
      forwardPath: function(req) {
        return '/' + options.path + req.url;
      },

      intercept: function(rsp, data, req, res, callback) {

        if (rsp.statusCode >= 200 && rsp.statusCode < 300) {
          if (options.onSuccess) {
            return options.onSuccess(rsp, data, req, res, callback);
          }
        } else {
          if (options.onError) {
            return options.onError(rsp, data, req, res, callback);
          }
        }

        callback(null, data);
      }
    })(req, res, function(err) {
      logger.error('Error while sending request to service', err);
      return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Error while sending request to service'}});
    });
  }

  function grace(req, res, options) {
    return graceperiod(req, res, options);
  }

  return {
    http: http,
    grace: grace
  };

};
