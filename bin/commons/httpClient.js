const request = require('request');
const q = require('q');

module.exports = httpClient;

function httpClient(options) {
  const deferred = q.defer();

  request(Object.assign({ json: true, method: 'GET' }, options), (err, resp, body) => {
    if (err) {
      return deferred.reject(err);
    }

    if (resp.statusCode < 200 || resp.statusCode > 299) {
      const message = body && body.error && body.error.details || `Bad HTTP response status code ${resp.statusCode}`;

      return deferred.reject(new Error(message));
    }

    return deferred.resolve(body);
  });

  return deferred.promise;
}
