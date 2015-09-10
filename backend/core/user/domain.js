'use strict';

var mongoose = require('mongoose');
var User = mongoose.model('User');
var utils = require('./utils');

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

  var collaboration = query.not_in_collaboration;
  var limit = query.limit;
  if (collaboration) {
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
      if (collaboration) {
        utils.filterByNotInCollaborationAndNoMembershipRequest(list, collaboration, function(err, results) {
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

module.exports.getUsersSearch = require('./search').searchByDomain;
