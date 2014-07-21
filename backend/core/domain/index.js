'use strict';

var mongoose = require('mongoose');
var Domain = mongoose.model('Domain');

function load(id, callback) {
  if (!id) {
    return callback(new Error('Domain id is required'));
  }
  return Domain.findOne({_id: id}, callback);
}
module.exports.load = load;

function userIsDomainAdministrator(user, domain, callback) {
  if (!user ||   !user._id) {
    return callback(new Error('User object is required'));
  }

  if (!domain || !domain._id) {
    return callback(new Error('Domain object is required'));
  }

  if (!domain.administrator) {
    return callback(null, false);
  }

  return callback(null, domain.administrator.equals(user._id));
}
module.exports.userIsDomainAdministrator = userIsDomainAdministrator;

function userIsDomainMember(user, domain, callback) {
  if (!user ||   !user._id) {
    return callback(new Error('User object is required'));
  }

  if (!domain || !domain._id) {
    return callback(new Error('Domain object is required'));
  }

  userIsDomainAdministrator(user, domain, function(err, isAdmin) {
    if (err) {
      return callback(err);
    }

    if (isAdmin) {
      return callback(null, true);
    }

    if (!user.domains || user.domains.length === 0) {
      return callback(null, false);
    }

    var belongs = user.domains.some(function(userdomain) {
      return userdomain.domain_id && userdomain.domain_id.equals(domain._id);
    });

    if (!belongs) {
      return callback(null, false);
    }
    return callback(null, true);
  });
}
module.exports.userIsDomainMember = userIsDomainMember;


