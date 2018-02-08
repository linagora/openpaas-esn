'use strict';

module.exports = function() {
  var host = process.env.ELASTICSEARCH_HOST || 'localhost';
  var port = process.env.ELASTICSEARCH_PORT || '9200';

  return {
    host: host + ':' + port
  };
};
