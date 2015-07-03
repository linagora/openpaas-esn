'use strict';

var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer();
var https = require('https');
var url = require('url');

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var graceperiod = require('./graceperiod')(dependencies);

  function http(req, res, options) {

    var params = {
      target: options.endpoint
    };

    var u = url.parse(params.target);

    if (u.protocol === 'https:') {
      params.agent = https.globalAgent;
      params.headers = {
        host: u.host
      };
    }

    proxy.web(req, res, params, function(err) {
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
