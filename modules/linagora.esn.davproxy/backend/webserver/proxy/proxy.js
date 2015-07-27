'use strict';

var httpproxy = require('express-http-proxy');
var url = require('url');

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var graceperiod = require('./graceperiod')(dependencies);

  function http(req, res, options) {
    var endpointUrl = url.parse(options.endpoint);

    var proxyPath = endpointUrl.pathname;
    if (proxyPath[proxyPath.length - 1] !== '/') {
      proxyPath = proxyPath + '/';
    }

    var forwardPath = proxyPath + options.path + req.url;
    var host = endpointUrl.protocol + '//' + endpointUrl.host;
    logger.debug('Proxy request to host %s on path %s', host, forwardPath);

    httpproxy(host, {
      forwardPath: function() {
        return forwardPath;
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
