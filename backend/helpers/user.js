'use strict';

var async = require('async');
var userModule = require('../core/user');
var domainModule = require('../core/domain');

function isInternalWithUserObject(user, callback) {
  async.some(user.domains, function(domain, callback) {
    domainModule.load(domain.domain_id, function(err, domainLoaded) {
      if (err) {
        return callback(false);
      }
      userModule.belongsToCompany(user, domainLoaded.company_name, function(err, belongsToCompany) {
        if (err) {
          return callback(false);
        }
        return callback(belongsToCompany);
      });
    });
  }, function(result) {
    return callback(null, result);
  });
}

module.exports.isInternal = function(user, callback) {
  if (!user) {
    return callback(new Error('User is required'));
  }

  if (user.domains) {
    return isInternalWithUserObject(user, callback);
  } else {
    userModule.get(user, function(err, userLoaded) {
      if (err) {
        return callback(err);
      }
      if (!userLoaded) {
        return callback(new Error('User with id "' + user + '" not found'));
      }
      return isInternalWithUserObject(userLoaded, callback);
    });
  }
};
