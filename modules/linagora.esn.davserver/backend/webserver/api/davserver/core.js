'use strict';

var esnconfig;
var CONFIG_KEY = 'davserver';
var DEFAULT_DAV_SERVER = 'http://localhost:80';

/**
 * Get the caldav server URL for the server
 *
 * @param {function} callback fn like callback(err, url)
 */
function getDavServerUrlForServer(callback) {
  esnconfig(CONFIG_KEY).get(function(err, data) {
    if (err) {
      return callback(err);
    }
    if (data && data.backend && data.backend.url) {
      return callback(null, data.backend.url);
    }
    return callback(null, DEFAULT_DAV_SERVER);
  });
}

/**
 * Get the caldav server URL for the browser (client)
 *
 * @param {function} callback fn like callback(err, url)
 */
function getDavServerUrlForClient(callback) {
  esnconfig(CONFIG_KEY).get(function(err, data) {
    if (err) {
      return callback(err);
    }
    if (data && data.frontend && data.frontend.url) {
      return callback(null, data.frontend.url);
    }
    return callback(null, DEFAULT_DAV_SERVER);
  });
}

module.exports = function(dependencies) {
  esnconfig = dependencies('esn-config');

  return {
    getDavServerUrlForServer: getDavServerUrlForServer,
    getDavServerUrlForClient: getDavServerUrlForClient
  };
};
