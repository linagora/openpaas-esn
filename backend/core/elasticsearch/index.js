'use strict';

const q = require('q');
const elasticsearch = require('elasticsearch');
const esnconfig = require('../esn-config');
const logger = require('../logger');

const TIMEOUT = 1000;
const DEFAULT_CONFIG = {
  host: `${(process.env.ES_HOST || 'localhost')}:${process.env.ES_PORT || 9200}` // eslint-disable-line no-process-env
};

let currentClient;
let currentClientHash;

module.exports = {
  client,
  getClient,
  updateClient,
  addDocumentToIndex,
  removeDocumentFromIndex,
  searchDocuments
};

/**
 * Digest the config parameter into md5sum
 *
 * @param {object} config
 * @return {string} the md5sum of the config object
 */
function getConfigurationHash(config) {
  const crypto = require('crypto');
  const md5sum = crypto.createHash('md5');

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
  esnconfig('elasticsearch').get((err, data) => {
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

    const hash = getConfigurationHash(data);

    if (hash === currentClientHash) {
      return callback(null, currentClient);
    }

    if (currentClient) {
      currentClient.close();
      currentClient = null;
    }
    currentClientHash = null;

    // Create Elasticsearch client
    const elasticsearchClient = new elasticsearch.Client(data);

    // Check if the connection was a success
    elasticsearchClient.ping({requestTimeout: TIMEOUT}, err => {
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

/**
 * Connect to Elasticsearch server.
 *
 * @param {function} callback function like callback(err, elasticsearchClient)
 */
function client(callback) {
  updateClient((err, elasticsearchClient) => callback(err, elasticsearchClient));
}

function getClient() {
  const defer = q.defer();

  client((err, esClient) => {
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

function addDocumentToIndex(document, options, callback) {
  getClient().then(esClient => {
    esClient.index({
      index: options.index,
      type: options.type,
      id: options.id,
      body: document
    }, callback);
  }, callback);
}

function removeDocumentFromIndex(options, callback) {
  getClient().then(esClient => {
    esClient.delete({
      index: options.index,
      type: options.type,
      id: options.id
    }, callback);
  }, callback);
}

function searchDocuments(options, callback) {
  getClient().then(esClient => {
    esClient.search(options, callback);
  }, callback);
}

// workaround circular dependencies: index -> listeners -> utils -> index
module.exports.listeners = require('./listeners');
