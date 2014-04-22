'use strict';

var mongoose = require('mongoose');
var User = mongoose.model('User');

var defaultLimit = 50;
var defaultOffset = 0;

/**
 * Get all users in a domain.
 *
 * @param {Domain or ObjectId} domain
 * @param {Hash} query - Hash with 'limit' and 'offset' for pagination, 'search' for filtering.
 *  Search can be a single string, an array of strings, or a space separated string list which will be splitted.
 *  In the case of array or space separated string, a AND search will be performed with the input terms.
 * @param {Function} cb - as fn(err, [User])
 */
var getUsers = function(domain, query, cb) {
  if (!domain) {
    return cb(new Error('Domain is mandatory'));
  }
  var domainId = domain._id || domain;
  query = query || {limit: defaultLimit, offset: defaultOffset};

  var userQuery = User.find().where('domains').elemMatch({domain_id: domainId});
  if (query.search) {

    var terms = (query.search instanceof Array) ? query.search : query.search.split(' ');

    if (terms.length > 1) {
      var firstname = [];
      var lastname = [];
      var emails = [];

      for (var i = 0; i < terms.length; i++) {
        var term = terms[i];
        firstname.push({firstname: new RegExp(term, 'i')});
        lastname.push({lastname: new RegExp(term, 'i')});
        emails.push({emails: new RegExp(term, 'i')});
      }
      userQuery.or([{$and: firstname}, {$and: lastname}, {$and: emails}]);
    } else {
      userQuery.or([{firstname: new RegExp(terms[0], 'i')}, {lastname: new RegExp(terms[0], 'i')}, {emails: new RegExp(terms[0], 'i')}]);
    }
  }

  var totalCountQuery = require('extend')(true, {}, userQuery);
  totalCountQuery.count();

  userQuery.skip(query.offset).limit(query.limit).sort({'firstname' : 'asc'});

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
};

module.exports.getUsers = getUsers;
