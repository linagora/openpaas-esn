'use strict';

var httpProxy = require('http-proxy');

var CONFIG_KEY = 'davserver';
var DEFAULT_DAV_SERVER = 'http://localhost:80';

var proxy = httpProxy.createProxyServer();

module.exports = function(dependencies) {

  var esnConfig = dependencies('esn-config');
  var logger = dependencies('logger');

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
        proxy.web(req, res, {
          target: endpoint + '/' + path
        }, function(err) {
          logger.error('Error while sending proxy request', err);
          return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Can not proxy the request'}});
        });
      });
    };
  }

  return {
    handle: handle
  };

};
