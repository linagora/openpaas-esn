'use strict';

var esnconfig;

/**
 * Get the carddav server URL for the browser (client)
 *
 * @param {function} callback fn like callback(err, url)
 */
function getClientDavUrl(callback) {
  esnconfig('dav').get(function(err, data) {
    var url = data && data.frontend && data.frontend.url;
    return callback(err, url || 'http://localhost');
  });
}

module.exports = function(dependencies) {
  esnconfig = dependencies('esn-config');

  return {
    getClientDavUrl: getClientDavUrl
  };
};
