'use strict';

var httpProxy = require('http-proxy');

var CONFIG_KEY = 'davserver';
var DEFAULT_DAV_SERVER = 'http://localhost:80';

var proxy = httpProxy.createProxyServer();
var serverUrlCache;

module.exports = function(dependencies) {

  var esnConfig = dependencies('esn-config');

  function getTarget(callback) {
    if (serverUrlCache) {
      return callback(serverUrlCache);
    }

    esnConfig(CONFIG_KEY).get(function(err, data) {
      if (err) {
        return callback(DEFAULT_DAV_SERVER);
      }

      if (data && data.backend && data.backend.url) {
        serverUrlCache = data && data.backend && data.backend.url;
      }
      return callback(serverUrlCache);
    });
  }

  function handle(path) {
    return function(req, res, next) {
      getTarget(function(endpoint) {
        proxy.web(req, res, {
          target: endpoint + '/' + path
        }, function(err) {
          return res.json(500, {err: err.message});
        });
      });
    };
  }

  return {
    handle: handle
  };

};
