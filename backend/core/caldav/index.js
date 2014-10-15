'use strict';

var esnconfig = require('../esn-config');
var client = require('./client');

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

module.exports.createCalendar = function(calendar, user, callback) {
  if (!calendar) {
    return callback(new Error('Calendar is required to create a calendar'));
  }

  if (!user) {
    return callback(new Error('Calendar owner is required'));
  }

  getCaldavServerUrlForServer(function(err, url) {
    if (err) {
     return callback(err);
    }

    if (!url) {
      return callback(new Error('No valid configuration can be found for caldav server'));
    }

    return client(url).createCalendar(calendar, user, callback);
  });
};
