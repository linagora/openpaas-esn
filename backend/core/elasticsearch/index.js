'use strict';

var esnconfig = require('../../core/esn-config');
var elasticsearch = require('elasticsearch');

/**
 * Connect to Elasticsearch server.
 *
 * @param {function} callback function like callback(err, elasticsearchClient)
 */
function client(callback) {
  esnconfig('elasticsearch').get(function(err, data) {
    if (err) {
      return callback(new Error('not found'));
    }
    var elasticsearchClient = new elasticsearch.Client(data);

    // Check if the connection was a success
    elasticsearchClient.ping({}, function(err) {
      if (err) {
        return callback(new Error('cannot connect'));
      }
      return callback(null, elasticsearchClient);
    });
  });
}
module.exports.client = client;
