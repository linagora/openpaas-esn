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
    var offset = query.offset || 0;
    var limit = query.limit || SEARCH.DEFAULT_LIMIT;

    var elasticsearchQuery = {
      query: {
        bool: {
          must: {
            multi_match: {
              query: terms,
              type: 'cross_fields',
              fields: [
                'summary',
                'description',
                'organizer.cn',
                'organizer.email',
                'attendees.email',
                'attendees.cn'
              ],
              operator: 'and',
              tie_breaker: 0.5
            }
          }
        }
      }
    };

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
          userId: query.userId.toString()
        }
      });
    }

    if (filters.length) {
      elasticsearchQuery.query.bool.filter = {
        and: filters
      };
    }

    logger.debug('Searching events with options', {
      userId: query.userId.toString(),
      calendarId: query.calendarId,
      search: terms,
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
