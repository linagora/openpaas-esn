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

function getNoReply(callback) {
  return esnconfig('mail').get(function(err, data) {
    if (err) {
      return callback(err);
    }
    var noreply = data && data.mail && data.mail.noreply ? data.mail.noreply : 'no-reply@openpaas.org';
    return callback(null, noreply);
  });
}

module.exports.getNoReply = getNoReply;
module.exports.getBaseUrl = getBaseUrl;
