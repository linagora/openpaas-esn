'use strict';

var request = require('request');
var url = require('url');

module.exports = function(options, callback) {

  if (options.url) {
    var u = url.parse(options.url);
    options.headers.host = u.host;
  }

  var requestOptions = {
    method: options.method || 'GET',
    json: options.json,
    url: options.url,
    headers: options.headers
  };

  if (options.body) {
    requestOptions.body = options.body;
  }

  request(requestOptions, callback);
};
