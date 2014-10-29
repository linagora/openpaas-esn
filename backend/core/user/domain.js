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
 * Get all users in a domain.
 *
 * @param {Domain, ObjectId} domain
 * @param {object} query - Hash with 'limit' and 'offset' for pagination.
 * @param {function} cb - as fn(err, result) with result: { total_count: number, list: [User1, User2, ...] }
 */
function getUsersList(domain, query, cb) {
  if (!domain) {
    return cb(new Error('Domain is mandatory'));
  }
  var domainId = domain._id || domain;
  query = query || {limit: defaultLimit, offset: defaultOffset};

  var userQuery = User.find().where('domains').elemMatch({domain_id: domainId});
  var totalCountQuery = require('extend')(true, {}, userQuery);
  totalCountQuery.count();

  userQuery.skip(query.offset).limit(query.limit).sort({'firstname': 'asc'});

  return totalCountQuery.exec(function(err, count) {
    if (!err) {
      userQuery.exec(function(err, list) {
        if (!err) {
          var result = {
            total_count: count,
            list: list
          };
          cb(null, result);
        }
        else {
          return cb(new Error('Cannot execute find request correctly on domains collection'));
        }
      });
    }
    else {
      return cb(new Error('Cannot count users of domain'));
    }
  });
}

module.exports.getUsersList = getUsersList;

/**
 * Get users in a domain by using a filter.
 *
 * @param {Domain, ObjectId} domain
 * @param {object} query - Hash with 'limit' and 'offset' for pagination, 'search' for filtering.
 *  Search can be a single string, an array of strings which will be joined, or a space separated string list.
 *  In the case of array or space separated string, a AND search will be performed with the input terms.
 * @param {function} cb - as fn(err, result) with result: { total_count: number, list: [User1, User2, ...] }
 */
function getUsersSearch(domain, query, cb) {
  if (!domain) {
    return cb(new Error('Domain is mandatory'));
  }
  if (!query.search) {
    return cb(new Error('query.search is mandatory, use getUsersList to list users'));
  }
  var domainId = domain._id || domain;
  query = query || {limit: defaultLimit, offset: defaultOffset};

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
            term: {
              'domains.domain_id': domainId
            }
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

      var result = {
        total_count: response.hits.total,
        list: response.hits.hits.map(function(hit) { return hit._source; })
      };
      return cb(null, result);
    });
  });
}

module.exports.getUsersSearch = getUsersSearch;
