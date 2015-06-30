'use strict';

var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer();

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var graceperiod = require('./graceperiod')(dependencies);

  function http(req, res, options) {
    proxy.web(req, res, {
      target: options.endpoint
    }, function(err) {
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
