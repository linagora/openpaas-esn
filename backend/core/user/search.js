'use strict';

var utils = require('./utils');

var DEFAULT_LIMIT = 50;
var DEFAULT_OFFSET = 0;

function getIndexName() {
  return 'users.idx';
}
module.exports.getIndexName = getIndexName;

function getTypeName() {
  return 'users';
}
module.exports.getTypeName = getTypeName;

/**
 * Search users in a domain by using a filter.
 *
 * @param {Domain[], ObjectId[]} domains array of domain where search users
 * @param {object} query - Hash with 'limit' and 'offset' for pagination, 'search' for filtering terms,
 *  'not_in_community' to return only members who are not in this community and no pending request with it.
 *  Search can be a single string, an array of strings which will be joined, or a space separated string list.
 *  In the case of array or space separated string, a AND search will be performed with the input terms.
 * @param {function} cb - as fn(err, result) with result: { total_count: number, list: [User1, User2, ...] }
 */
function searchByDomain(domains, query, cb) {
  if (!domains) {
    return cb(new Error('Domains is mandatory'));
  }
  if (!(domains instanceof Array)) {
    return cb(new Error('Domains must be an array'));
  }
  if (domains.length === 0) {
    return cb(new Error('At least one domain is mandatory'));
  }
  if (!query.search) {
    return cb(new Error('query.search is mandatory, use getUsersList to list users'));
  }
  var elasticsearchOrFilters = domains.map(function(domain) {
    return {
      term: {
        'domains.domain_id': domain._id || domain
      }
    };
  });
  query = query || {limit: DEFAULT_LIMIT, offset: DEFAULT_OFFSET};

  var collaboration = query.not_in_collaboration;
  var limit = query.limit;
  if (collaboration) {
    query.limit = null;
  }

  var elasticsearch = require('../elasticsearch');
  elasticsearch.client(function(err, elascticsearchClient) {
    if (err) {
      return cb(err);
    }

    var terms = (query.search instanceof Array) ? query.search.join(' ') : query.search;

    var elasticsearchQuery = {
      sort: [
        {'firstname.sort': 'asc'}
      ],
      query: {
        filtered: {
          filter: {
            or: elasticsearchOrFilters
          },
          query: {
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

    elascticsearchClient.search({
      index: getIndexName(),
      type: getTypeName(),
      from: query.offset,
      size: query.limit,
      body: elasticsearchQuery
    }, function(err, response) {
      if (err) {
        return cb(err);
      }

      var list = response.hits.hits;
      var users = list.map(function(hit) { return hit._source; });

      if (collaboration) {
        utils.filterByNotInCollaborationAndNoMembershipRequest(users, collaboration, function(err, results) {
          if (err) {
            return cb(err);
          }
          var filterCount = results.length;
          if (filterCount > limit) {
            results = results.slice(0, limit);
          }
          return cb(null, {
            total_count: filterCount,
            list: results
          });
        });
      } else {
        return cb(null, {
          total_count: response.hits.total,
          list: users
        });
      }
    });
  });
}
module.exports.searchByDomain = searchByDomain;
