'use strict';

var esnconfig = require('../esn-config');
var elasticsearch = require('elasticsearch');
var q = require('q');

var currentClient,
  currentClientHash = null;

/**
 * Digest the config parameter into md5sum
 *
 * @param {object} config
 * @return {string} the md5sum of the config object
 */
function getConfigurationHash(config) {
  var crypto = require('crypto');

  var md5sum = crypto.createHash('md5');
  md5sum.update(JSON.stringify(config));
  return md5sum.digest('hex');
}

/**
 * Update the current Client
 *
 * @param {function} callback function like callback(err, elasticsearchClient)
 */
function updateClient(callback) {
  esnconfig('elasticsearch').get(function(err, data) {
    if (err) {
      if (currentClient) {
        currentClient.close();
        currentClient = null;
      }
      currentClientHash = null;
      return callback(new Error('not found'));
    }

    var hash = getConfigurationHash(data);
    if (hash === currentClientHash) {
      return callback(null, currentClient);
    }

    if (currentClient) {
      currentClient.close();
      currentClient = null;
    }
    currentClientHash = null;

    // Create Elasticsearch client
    var elasticsearchClient = new elasticsearch.Client(data);

    // Check if the connection was a success
    elasticsearchClient.ping({}, function(err) {
      if (err) {
        return callback(new Error('cannot connect'));
      }

      currentClient = elasticsearchClient;
      currentClientHash = hash;

      return callback(null, elasticsearchClient);
    });

  });
}
module.exports.updateClient = updateClient;

/**
 * Connect to Elasticsearch server.
 *
 * @param {function} callback function like callback(err, elasticsearchClient)
 */
function client(callback) {
  updateClient(function(err, elasticsearchClient) {
    return callback(err, elasticsearchClient);
  });
}
module.exports.client = client;

function getClient() {
  var defer = q.defer();
  client(function(err, esClient) {
    if (err) {
      defer.reject(err);
    }

    if (!esClient) {
      defer.reject(new Error('Can not get ES client'));
    }

    defer.resolve(esClient);
  });
  return defer.promise;
}
module.exports.getClient = getClient;

function addDocumentToIndex(document, options, callback) {
  getClient().then(function(esClient) {
    esClient.index({
      index: options.index,
      type: options.type,
      id: options.id,
      body: document
    }, callback);
  }, callback);
}
module.exports.addDocumentToIndex = addDocumentToIndex;

function removeDocumentFromIndex(options, callback) {
  getClient().then(function(esClient) {
    esClient.delete({
      index: options.index,
      type: options.type,
      id: options.id
    }, callback);
  }, callback);
}
module.exports.removeDocumentFromIndex = removeDocumentFromIndex;

function getIndexName() {
  return 'users.idx';
}
module.exports.getIndexName = getIndexName;

function getTypeName() {
  return 'users';
}
module.exports.getTypeName = getTypeName;
