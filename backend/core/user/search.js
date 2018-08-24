'use strict';

const _ = require('lodash');
const utils = require('./utils');
const CONSTANTS = require('./constants');

module.exports = {
  getIndexName,
  getTypeName,
  search,
  searchByDomain
};

function getIndexName() {
  return CONSTANTS.ELASTICSEARCH.index;
}

function getTypeName() {
  return CONSTANTS.ELASTICSEARCH.type;
}

/**
 * Search users in domains.
 *
 * @param {Domain[], ObjectId[]} domains array of domain where search users
 * @param {object} options - Hash with:
 * - 'limit' and 'offset' for pagination
 * - 'search' for filtering terms.
 * - 'not_in_collaboration' to return only users who are not in this collaboration and no pending request with it.
 * Search can be a single string, an array of strings which will be joined, or a space separated string list.
 *  In the case of array or space separated string, a AND search will be performed with the input terms.
 * @param {function} callback - as fn(err, result) with result: { total_count: number, list: [User1, User2, ...] }
 */
function searchByDomain(domains, options, callback) {
  if (!domains) {
    return callback(new Error('Domains is mandatory'));
  }

  if (!(domains instanceof Array)) {
    return callback(new Error('Domains must be an array'));
  }

  if (domains.length === 0) {
    return callback(new Error('At least one domain is mandatory'));
  }

  options.domains = domains;

  return _search(options, callback);
}

/**
 * Search users in system.
 *
 * @param {object} options - Hash with:
 * - 'limit' and 'offset' for pagination
 * - 'search' for filtering terms
 * - 'not_in_collaboration' to return only users who are not in this collaboration and no pending request with it.
 * Search can be a single string, an array of strings which will be joined, or a space separated string list.
 *  In the case of array or space separated string, a AND search will be performed with the input terms.
 * @param {function} callback - as fn(err, result) with result: { total_count: number, list: [User1, User2, ...] }
 */
function search(options, callback) {
  return _search(options, callback);
}

function _search(options, callback) {
  options.limit = +options.limit || CONSTANTS.USERS_SEARCH_DEFAULT_LIMIT;
  options.offset = +options.offset || CONSTANTS.USERS_SEARCH_DEFAULT_OFFSET;

  if (!options.search) {
    return callback(new Error('query.search is mandatory, use getUsersList to list users'));
  }

  const collaboration = options.not_in_collaboration;
  const limit = options.limit;

  if (collaboration) {
    options.limit = null;
  }

  const elasticsearch = require('../elasticsearch');

  return elasticsearch.client((err, elascticsearchClient) => {
    if (err) {
      return callback(err);
    }

    const terms = (options.search instanceof Array) ? options.search.join(' ') : options.search;

    const elasticsearchQuery = {
      sort: [
        {'firstname.sort': 'asc'}
      ],
      query: {
        bool: {
          filter: {
            or: _getElasticsearchOrFilters(options.domains)
          },
          must_not: _getElasticsearchMustNotQuery(options),
          must: {
            multi_match: {
              query: terms,
              type: 'cross_fields',
              fields: ['firstname', 'lastname', 'accounts.emails'],
              operator: 'and'
            }
          }
        }
      }
    };

    return elascticsearchClient.search({
      index: getIndexName(),
      type: getTypeName(),
      from: options.offset,
      size: options.limit,
      body: elasticsearchQuery
    }, (err, response) => {
      if (err) {
        return callback(err);
      }

      const list = response.hits.hits;
      const users = list.map(function(hit) { return _.extend(hit._source, { _id: hit._source.id }); });

      if (collaboration) {
        return _filterUsersByCollaboration(users, collaboration, limit, callback);
      }

      return callback(null, {
        total_count: response.hits.total,
        list: users
      });
    });
  });
}

function _getElasticsearchOrFilters(domains) {
  if (!domains || domains.length === 0) {
    return;
  }

  return domains.map(domain => {
    const filter = {
      term: {
        'domains.domain_id': domain._id || domain
      }
    };

    return filter;
  });
}

function _getElasticsearchMustNotQuery(options) {
  if (options.includesDisabledSearchable) {
    return;
  }

  return {
    nested: {
      path: 'states',
      query: {
        bool: {
          must: [{
            term: {
              'states.name': CONSTANTS.USER_ACTIONS.searchable
            }
          }, {
            term: {
              'states.value': CONSTANTS.USER_ACTION_STATES.disabled
            }
          }]
        }
      }
    }
  };
}

function _filterUsersByCollaboration(users, collaboration, limit, callback) {
  return utils.filterByNotInCollaborationAndNoMembershipRequest(users, collaboration, (err, results) => {
    if (err) {
      return callback(err);
    }
    const filterCount = results.length;

    if (filterCount > limit) {
      results = results.slice(0, limit);
    }

    return callback(null, {
      total_count: filterCount,
      list: results
    });
  });
}
