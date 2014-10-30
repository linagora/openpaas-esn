'use strict';

var esnconfig = require('../esn-config');

/**
 * Get the caldav server URL for the server
 *
 * @param {function} callback fn like callback(err, url)
 */
function getCaldavServerUrlForServer(callback) {
  esnconfig('caldav').get(function(err, data) {
    if (err) {
      return callback(err);
    }
    if (data && data.backend && data.backend.url) {
      return callback(null, data.backend.url);
    }
    return callback(null, 'http://localhost:80');
  });
}
module.exports.getCaldavServerUrlForServer = getCaldavServerUrlForServer;

/**
 * Get the caldav server URL for the browser (client)
 *
 * @param {function} callback fn like callback(err, url)
 */
function getCaldavServerUrlForClient(callback) {
  esnconfig('caldav').get(function(err, data) {
    if (err) {
      return callback(err);
    }
    if (data && data.frontend && data.frontend.url) {
      return callback(null, data.frontend.url);
    }
    return callback(null, 'http://localhost:80');
  });
}
module.exports.getCaldavServerUrlForClient = getCaldavServerUrlForClient;
