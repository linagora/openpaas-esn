'use strict';

var mongoose = require('mongoose');
var User = mongoose.model('User');

var defaultLimit = 50;
var defaultOffset = 0;

function getUserDomains(user, callback) {
  if (!user) {
    return callback(new Error('User is mandatory'));
  }

  var id = user._id || user;
  return User.findById(id).populate('domains.domain_id', null, 'Domain').exec(function(err, result) {
    if (err) {
      return callback(err);
    }

    if (!result) {
      return callback();
    }

    if (result.domains && result.domains.length > 0) {
      var domains = [];
      result.domains.forEach(function(domain) {
        domains.push(domain.domain_id);
      });
      return callback(null, domains);
    }
    return callback();
  });
}
module.exports.getUserDomains = getUserDomains;

/**
 * Return an array of users who are not in the community AND
 *  who have no pending membership request/invitation.
 *
 * @param {User[]} users array of user
 * @param {Community} community the community
 * @param {function} callback fn like callback(err, users) (users is an array of users)
 */
function filterByNotInCommunityAndNoMembershipRequest(users, community, callback) {
  if (!users) {
    return callback(new Error('Users is mandatory'));
  }
  if (!community) {
    return callback(new Error('Community is mandatory'));
  }

  var results = [];

  var memberHash = {};
  if (community.members) {
    community.members.forEach(function(member) {
      memberHash[member.user] = true;
    });
  }
  if (community.membershipRequests) {
    community.membershipRequests.forEach(function(membershipRequest) {
      memberHash[membershipRequest.user] = true;
    });
  }

  users.forEach(function(user) {
    if (!memberHash[user._id]) {
      results.push(user);
    }
  });
  return callback(null, results);
}

/**
 * Get all users in a domain.
 *
 * @param {Domain[], ObjectId[]} domains array of domain where search users
 * @param {object} query - Hash with 'limit' and 'offset' for pagination.
 *  'not_in_community' to return only members who are not in this community and no pending request with it.
 * @param {function} cb - as fn(err, result) with result: { total_count: number, list: [User1, User2, ...] }
 */
function getUsersList(domains, query, cb) {
  if (!domains) {
    return cb(new Error('Domains is mandatory'));
  }
  if (!(domains instanceof Array)) {
    return cb(new Error('Domains must be an array'));
  }
  if (domains.length === 0) {
    return cb(new Error('At least one domain is mandatory'));
  }
  query = query || {limit: defaultLimit, offset: defaultOffset};

  var community = query.not_in_community;
  var limit = query.limit;
  if (community) {
    query.limit = null;
  }

  var domainIds = domains.map(function(domain) {
    return domain._id || domain;
  });
  var userQuery = User.find().where('domains.domain_id'). in (domainIds);
  var totalCountQuery = require('extend')(true, {}, userQuery);
  totalCountQuery.count();

  userQuery.skip(query.offset).limit(query.limit).sort({'firstname': 'asc'});

  return totalCountQuery.exec(function(err, count) {
    if (err) {
      return cb(new Error('Cannot count users of domain'));
    }
    userQuery.exec(function(err, list) {
      if (err) {
        return cb(new Error('Cannot execute find request correctly on domains collection'));
      }
      if (community) {
        filterByNotInCommunityAndNoMembershipRequest(list, community, function(err, results) {
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
          total_count: count,
          list: list
        });
      }
    });
  });
}

module.exports.getUsersList = getUsersList;

/**
 * Get users in a domain by using a filter.
 *
 * @param {Domain[], ObjectId[]} domains array of domain where search users
 * @param {object} query - Hash with 'limit' and 'offset' for pagination, 'search' for filtering terms,
 *  'not_in_community' to return only members who are not in this community and no pending request with it.
 *  Search can be a single string, an array of strings which will be joined, or a space separated string list.
 *  In the case of array or space separated string, a AND search will be performed with the input terms.
 * @param {function} cb - as fn(err, result) with result: { total_count: number, list: [User1, User2, ...] }
 */
function getUsersSearch(domains, query, cb) {
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
  query = query || {limit: defaultLimit, offset: defaultOffset};

  var community = query.not_in_community;
  var limit = query.limit;
  if (community) {
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
              fields: ['firstname', 'lastname', 'emails'],
              operator: 'and'
            }
          }
        }
      }
    };

    elascticsearchClient.search({
      index: elasticsearch.getIndexName(),
      type: elasticsearch.getTypeName(),
      from: query.offset,
      size: query.limit,
      body: elasticsearchQuery
    }, function(err, response) {
      if (err) {
        return cb(err);
      }

      var list = response.hits.hits;
      var users = list.map(function(hit) { return hit._source; });
      var community = query.not_in_community;

      if (community) {
        filterByNotInCommunityAndNoMembershipRequest(users, community, function(err, results) {
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

module.exports.getUsersSearch = getUsersSearch;
