'use strict';

const elastic = require('../elasticsearch');
const _ = require('lodash');
const CONSTANTS = require('./constants');

module.exports = {
  find
};

/**
 * Search communities in the given domains where the title match the query.search terms.
 */
function find(domains, query, callback) {

  elastic.client((err, client) => {
    if (err) {
      return callback(err);
    }

    query = query || {limit: CONSTANTS.DEFAULT_LIMIT, offset: CONSTANTS.DEFAULT_OFFSET};
    const elasticsearchOrFilters = domains.map(domain => ({term: {domain_ids: domain._id}}));
    const terms = (query.search instanceof Array) ? query.search.join(' ') : query.search;
    const elasticsearchQuery = {
      sort: [
        {title: 'asc'}
      ],
      query: {
        bool: {
          filter: {
            or: elasticsearchOrFilters
          },
          must: {
            match: {
              title: {
                type: 'phrase_prefix',
                query: terms,
                slop: 10
              }
            }
          }
        }
      }
    };

    client.search({
      index: CONSTANTS.ELASTICSEARCH.index,
      type: CONSTANTS.ELASTICSEARCH.type,
      from: query.offset,
      size: query.limit,
      body: elasticsearchQuery

    }, (err, response) => {
      if (err) {
        return callback(err);
      }

      const list = response.hits.hits;
      const communities = list.map(function(hit) { return _.extend(hit._source, { _id: hit._source.id }); });

      return callback(null, {
        total_count: response.hits.total,
        list: communities
      });
    });
  });
}
