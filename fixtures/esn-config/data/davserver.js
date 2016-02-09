'use strict';

module.exports = function() {
  var host = process.env.DAV_SERVER_HOST || 'localhost';
  var port = process.env.DAV_SERVER_PORT || '8001';

  return {
    _id: 'davserver',
    backend: {
      url: 'http://' + host + ':' + port
    }
  }
};
