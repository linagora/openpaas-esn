'use strict';

var q = require('q');
var CONFIG_KEY = 'davserver';
var DEFAULT_DAV_SERVER = 'http://localhost:80';

module.exports = function(dependencies) {

  var esnConfig = dependencies('esn-config');
  var domainConfig = dependencies('domain-config');

  function _getDavConfig(domainId) {
    if (!domainId) {
      return q.ninvoke(esnConfig(CONFIG_KEY), 'get');
    }

    return domainConfig.get(domainId, CONFIG_KEY).catch(function() {
      return q.ninvoke(esnConfig(CONFIG_KEY), 'get');
    });
  }

  function getDavEndpoint(domainId, callback) {
    if (!callback && typeof domainId === 'function') {
      callback = domainId;
      domainId = null;
    }

    _getDavConfig(domainId).then(function(data) {
      if (data && data.backend && data.backend.url) {
        return callback(data.backend.url);
      }

      return callback(DEFAULT_DAV_SERVER);
    }).catch(function() {
      callback(DEFAULT_DAV_SERVER);
    });
  }

  return {
    getDavEndpoint: getDavEndpoint
  };

};
