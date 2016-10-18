'use strict';

var esnconfig = require('../core/esn-config');
var url = require('url');
var staticConfig = require('../core/config')('default');
var STATIC_BASE_URL = url.format({
  protocol: 'http',
  hostname: 'localhost',
  port: staticConfig.webserver.port || '8080'
});

function getBaseUrl(user, callback) {
  return esnconfig('web').forUser(user).get(function(err, web) {
    if (err) {
      return callback(err);
    }

    if (web && web.base_url) {
      return callback(null, web.base_url);
    }

    return callback(null, STATIC_BASE_URL);
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
