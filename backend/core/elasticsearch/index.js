'use strict';

const esnconfig = require('../esn-config'),
      logger = require('../logger'),
      elasticsearch = require('elasticsearch'),
      q = require('q');

const TIMEOUT = 1000,
      DEFAULT_CONFIG = {
        host: `${(process.env.ES_HOST || 'localhost')}:${process.env.ES_PORT || 9200}`
      };

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
 * Get default Elasticsearch configuration. We clone the default config because
 * the ES client modifies the config object.
 * See more at https://github.com/elastic/elasticsearch-js/issues/33
 *
 * @return {Object} a copy of default Elasticsearch configuration
 */
function getDefaultConfig() {
  return Object.assign({}, DEFAULT_CONFIG);
}

/**
 * Update the current Client
 *
 * @param {function} callback function like callback(err, elasticsearchClient)
 */
function updateClient(callback) {
  esnconfig('elasticsearch').get(function(err, data) {
    if (err) {
      logger.error('Error while getting elasticsearch configuration', err);
      if (currentClient) {
        currentClient.close();
        currentClient = null;
      }
      currentClientHash = null;

      return callback(err);
    }

    if (!data) {
      data = getDefaultConfig();
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
    elasticsearchClient.ping({requestTimeout: TIMEOUT}, function(err) {
      if (err) {
        logger.error('Cannot connect to Elasticsearch server', err);

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
      return defer.reject(err);
    }

    if (!esClient) {
      return defer.reject(new Error('Can not get ES client'));
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

function searchDocuments(options, callback) {
  getClient().then(function(esClient) {
    esClient.search(options, callback);
  }, callback);
}
module.exports.searchDocuments = searchDocuments;

module.exports.listeners = require('./listeners');
