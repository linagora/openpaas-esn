'use strict';

var mongoose = require('mongoose');
var User = mongoose.model('User');

var defaultLimit = 50;
var defaultOffset = 0;

/**
 * Get all users in a domain.
 *
 * @param {Domain or ObjectId} domain
 * @param {Hash} query. Hash with 'limit' and 'offset' for pagination, 'search' for filtering.
 * @param {Function} cb. as fn(err, [User])
 */
var getUsers = function(domain, query, cb) {
  if (!domain) {
    return cb(new Error('Domain is mandatory'));
  }
  var domainId = domain._id || domain;
  query = query || {limit: defaultLimit, offset: defaultOffset};

  var q = User.find().where('domains').elemMatch({domain_id: domainId});
  if (query.search) {
    q.or([{firstname: new RegExp(query.search, 'i')}, {lastname: new RegExp(query.search, 'i')}, {emails: new RegExp(query.search, 'i')}]);
  }
  q.skip(query.offset).limit(query.limit).sort({'timestamps.creation' : 'asc'});
  return q.exec(cb);
};
module.exports.getUsers = getUsers;
