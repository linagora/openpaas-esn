'use strict';

var CONSTANTS = require('../constants');
var SEARCH = CONSTANTS.SEARCH;

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var listener = require('./searchHandler')(dependencies);
  var elasticsearch = dependencies('elasticsearch');
  var searchHandler;

  function indexEvent(event, callback) {
    if (!searchHandler) {
      return callback(new Error('Event search is not initialized'));
    }

    if (!event) {
      return callback(new Error('Event is required'));
    }

    searchHandler.indexData(event, callback);
  }

  function removeEventFromIndex(event, callback) {
    if (!searchHandler) {
      return callback(new Error('Event search is not initialized'));
    }

    if (!event) {
      return callback(new Error('Event is required'));
    }

    searchHandler.removeFromIndex(event, callback);
  }

  function searchEvents(query, callback) {
    var terms = query.search;
    var page = query.page || 1;
    var offset = query.offset;
    var limit = query.limit || SEARCH.DEFAULT_LIMIT;
    var filters = [];

    if (query.calendarId) {
      filters.push({
        term: {
          calendarId: query.calendarId
        }
      });
    }

    if (query.userId) {
      filters.push({
        term: {
          userId: query.userId
        }
      });
    }

    var elasticsearchQuery = {
      query: {
        bool: {
          must: {
            match: {
              _all: terms
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

    logger.debug('Searching events with options', {
      userId: query.userId,
      calendarId: query.calendarId,
      search: terms,
      page: page,
      offset: offset,
      limit: limit
    });

    elasticsearch.searchDocuments({
      index: SEARCH.INDEX_NAME,
      type: SEARCH.TYPE_NAME,
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
    logger.info('Subscribing to event updates for indexing');
    searchHandler = listener.register();
  }

  return {
    listen: listen,
    searchEvents: searchEvents,
    indexEvent: indexEvent,
    removeEventFromIndex: removeEventFromIndex
  };
};
