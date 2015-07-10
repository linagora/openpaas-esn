'use strict';

var request = require('request');

module.exports = function(options, callback) {

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
