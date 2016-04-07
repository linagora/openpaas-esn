'use strict';

var esnconfig = require('../core/esn-config');
var staticConfig = require('../core/config')('default');

function getBaseUrl(callback) {
  return esnconfig('web').get(function(err, web) {
    if (err) {
      return callback(err);
    }
    var baseUrl = 'http://localhost:';
    if (web && web.base_url) {
      baseUrl = web.base_url;
    } else {
      var port = staticConfig.webserver.port || '8080';
      baseUrl += port;
    }
    return callback(null, baseUrl);
  });
}

module.exports.getBaseUrl = getBaseUrl;
