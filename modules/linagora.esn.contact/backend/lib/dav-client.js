'use strict';

var url = require('url');
var request = require('request');
var q = require('q');

var VCARD_JSON = 'application/vcard+json';

function rawClient(options, callback) {

  if (!options) {
    return callback(new Error('Options is required'));
  }

  var headers = options.headers || {};

  if (options.url) {
    var u = url.parse(options.url);
    headers.host = u.host;
  }

  var requestOptions = {
    method: options.method || 'GET',
    json: options.json,
    url: options.url,
    headers: headers
  };

  if (options.body) {
    requestOptions.body = options.body;
  }

  request(requestOptions, callback);
}
module.exports.rawClient = rawClient;

module.exports.get = function(options) {
  if (!options) {
    return q.reject(new Error('Options required'));
  }

  var defer = q.defer();
  var headers = options.headers || {};
  headers.accept = VCARD_JSON;

  rawClient({headers: headers, json: true, url: options.url}, function(err, response, body) {
    if (err) {
      return defer.reject(err);
    }

    if (response.statusCode < 200 || response.statusCode > 299) {
      return defer.reject(new Error('Error while getting the contact (HTTP %s)', response.statusCode));
    }

    return defer.resolve(body);
  });
  return defer.promise;
};
