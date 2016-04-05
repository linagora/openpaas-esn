'use strict';

var esnconfig;
var staticConfig;

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

module.exports = function(dependencies) {
  esnconfig = dependencies('esn-config');
  staticConfig = dependencies('config')('default');

  return {
    getBaseUrl: getBaseUrl
  };
};
