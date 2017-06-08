'use strict';

var CONSTANTS = require('../constants');

var INDEX_NAME = CONSTANTS.SEARCH.INDEX_NAME;
var TYPE_NAME = CONSTANTS.SEARCH.TYPE_NAME;
var DEFAULT_LIMIT = CONSTANTS.SEARCH.DEFAULT_LIMIT;

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var elasticsearch = dependencies('elasticsearch');
  var listener = require('./listener')(dependencies);
  var searchHandler;

  function indexContact(contact, callback) {
    logger.debug('Indexing contact into elasticseach', contact);

    if (!searchHandler) {
      return callback(new Error('Contact search is not initialized'));
    }

    if (!contact) {
      return callback(new Error('Contact is required'));
    }
    searchHandler.indexData(contact, callback);
  }

  function removeContactFromIndex(contact, callback) {
    logger.info('Removing contact from index', contact);

    if (!searchHandler) {
      return callback(new Error('Contact search is not initialized'));
    }

    if (!contact) {
      return callback(new Error('Contact is required'));
    }
    searchHandler.removeFromIndex(contact, callback);
  }

  function searchContacts(query, callback) {
    var terms = query.search;
    var page = query.page ? (!isNaN(query.page) ? query.page : 1) : 1;
    var offset = query.offset;
    var limit = query.limit || DEFAULT_LIMIT;

    var filters = [];
    if (query.userId) {
      filters.push({
        term: {
          userId: query.userId
        }
      });
    }

    if (query.bookId) {
      filters.push({
        term: {
          bookId: query.bookId
        }
      });
    }

    if (query.bookName) {
      filters.push({
        term: {
          bookName: query.bookName
        }
      });
    }

    var elasticsearchQuery = {
      query: {
        bool: {
          must: {
            multi_match: {
              query: terms,
              type: 'cross_fields',
              fields: ['firstName^1000',
                'lastName^1000',
                'nickname^1000',
                'org^100',
                'tel.value^100',
                'tags.text^100',
                'comments^100',
                'emails.value^100',
                'socialprofiles.value^100',
                'job^10',
                'birthday',
                'urls.value',
                'addresses.full'],
              operator: 'and',
              tie_breaker: 0.5
            }
          }
        }
      }
    };
    if (filters.length) {
      elasticsearchQuery.query.bool.filter = {
        and: filters
      };
    }
    if (!offset) {
      offset = (page - 1) * limit;
    }

    logger.debug('Searching contacts with options', {
      userId: query.userId,
      bookId: query.bookId,
      bookName: query.bookName,
      search: terms,
      page: page,
      offset: offset,
      limit: limit
    });

    elasticsearch.searchDocuments({
      index: INDEX_NAME,
      type: TYPE_NAME,
      from: offset,
      size: limit,
      body: elasticsearchQuery
    }, function(err, result) {
      if (err) {
        return callback(err);
      }
      return callback(null, {
        current_page: page,
        total_count: result.hits.total,
        list: result.hits.hits
      });
    });
  }

  function listen() {
    logger.info('Subscribing to contact updates for indexing');
    searchHandler = listener.register();
  }

  return {
    listen: listen,
    searchContacts: searchContacts,
    indexContact: indexContact,
    removeContactFromIndex: removeContactFromIndex
  };

};
