'use strict';

module.exports = function() {
  var host = process.env.JMAP_SERVER_HOST || 'localhost';
  var port = process.env.JMAP_SERVER_PORT || 80;
  var path = process.env.JMAP_SERVER_PATH || 'jmap';

  return {
    api: 'http://' + host + ':' + port + '/' + path
  };
};
