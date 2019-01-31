const q = require('q');
const elasticsearch = require('elasticsearch');
const ESConfiguration = require('esn-elasticsearch-configuration');
const EsnConfig = require('../esn-config').EsnConfig;
const logger = require('../logger');

const TIMEOUT = 1000;
const DEFAULT_CONFIG = {
  host: `${(process.env.ES_HOST || 'localhost')}:${process.env.ES_PORT || 9200}` // eslint-disable-line no-process-env
};
const DEFAULT_SCROLL_TIME = '10s';
const DEFAULT_LIMIT = 20;

let currentClient;
let currentClientHash;

module.exports = {
  addDocumentToIndex,
  client,
  getClient,
  reconfig,
  reindex,
  removeDocumentFromIndex,
  removeDocumentsByQuery,
  searchDocuments,
  updateClient
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
 * Get Elasticsearch configuration.
 *
 * @return {Promise} resolve on success
 */
function getConfig() {
  return new EsnConfig().get('elasticsearch')
    .then(config => config || getDefaultConfig());
}

/**
  * Get an instance of esn-elasticsearch-configuration module
  *
  * @return {Promise} resolve on success
  */
function getESConfigurationInstance() {
  return getConfig()
    .then(config => new ESConfiguration({ url: config.host }));
}

/**
 * Update the current Client
 *
 * @param {function} callback function like callback(err, elasticsearchClient)
 */
function updateClient(callback) {
  return getConfig().then(config => {
    const hash = getConfigurationHash(config);

    if (hash === currentClientHash) {
      return callback(null, currentClient);
    }

    if (currentClient) {
      currentClient.close();
      currentClient = null;
    }
    currentClientHash = null;

    // Create Elasticsearch client
    const elasticsearchClient = new elasticsearch.Client(config);

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

  }, err => {
    if (currentClient) {
      currentClient.close();
      currentClient = null;
    }
    currentClientHash = null;

    return callback(err);
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

/**
 * Delete documents by query using scroll and bulk.
 * For more detail see https://www.elastic.co/guide/en/elasticsearch/plugins/2.3/plugins-delete-by-query.html
 *
 * @param  {Object}   query    query object
 * @param  {Function} callback callback function
 */
function removeDocumentsByQuery(query, callback) {
  getClient().then(esClient => {
    let deleted = [];
    const scrollIds = [];

    query = Object.assign({
      scroll: DEFAULT_SCROLL_TIME, // https://www.elastic.co/guide/en/elasticsearch/reference/2.3/search-request-scroll.html
      size: DEFAULT_LIMIT,
      sort: '_doc'
    }, query);

    const deleteFoundsAndContinueSearch = founds => {
      scrollIds.push(founds._scroll_id);

      if (founds.hits.total === 0) {
        return q.when({ deleted });
      }

      const bulkToDelete = founds.hits.hits.map(doc => ({
        delete: {
          _index: doc._index,
          _type: doc._type,
          _id: doc._id
        }
      }));

      return esClient
        .bulk({
          body: bulkToDelete
        })
        .then(() => {
          deleted = deleted.concat(founds.hits.hits);

          if (founds.hits.total > deleted.length) {
            esClient.scroll({
              scrollId: founds._scroll_id,
              scroll: DEFAULT_SCROLL_TIME
            }, deleteFoundsAndContinueSearch);
          } else {
            return { deleted };
          }
        });
    };

    esClient.search(query)
      .then(deleteFoundsAndContinueSearch)
      .then(res => { callback(null, res); })
      .catch(callback)
      .finally(() => {
        esClient.clearScroll({
          scrollId: scrollIds.join(',')
        });
      });
  }, callback);
}

function searchDocuments(options, callback) {
  getClient().then(esClient => {
    esClient.search(options, callback);
  }, callback);
}

/**
  * Re-configure configuration for index
  *
  * @param {string} name - The name of index
  * @param {string} type - The type of index (users, contacts, ...)
  *
  * @return {Promise} - resolve on success
  */
function reconfig(name, type) {
  return getESConfigurationInstance()
    .then(esConfiguration => esConfiguration.reconfigure(name, type));
}

/**
  * Re-configure configuration and reindex data for index
  *
  * @param {Object}   options - The object contains infomation of index which be reindexed includes:
  *                              + index: The name of index
  *                              + type: The type of index (users, contacts, ...)
  *                              + next: The function allow to load sequence documents instead all at the same time
  *                              + getId: The function to get document ID
  *                              + denormalize: The function is used to denormalize a document
  * @return {Promise} - resolve on success
  */
function reindex(options) {
  return getESConfigurationInstance()
    .then(esConfiguration => esConfiguration.reindexAll(options));
}
