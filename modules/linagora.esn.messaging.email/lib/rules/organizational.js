'use strict';

var async = require('async');

module.exports = function(lib, dependencies) {

  var userModule = dependencies('user');
  var domainModule = userModule.domain;
  var userHelper = userModule.helpers.user;
  var logger = dependencies('logger');

  function getUsers(domain, companyname, callback) {
    domainModule.getUsersList([domain], {limit: null, offset: 0}, function(err, users) {
      if (err) {
        return callback(err);
      }

      async.filter(users.list, function(user, callback) {
          userHelper.isInternal(user, function(err, internal) {
            if (internal) {
              return callback(false);
            }
            userModule.belongsToCompany(user, companyname, function(err, hasCompany) {
              return callback(hasCompany);
            });
        });
      }, function(filtered) {
        return callback(null, filtered);
      });
    });
  }

  function getUsersInCompany(collaboration, companyname, callback) {
    async.map(collaboration.domain_ids, function(domain, callback) {
      return getUsers(domain, companyname, callback);
    }, function(err, results) {
      var result = [];
      results.forEach(function(array) {
        result = result.concat(array);
      });
      return callback(null, result);
    });
  }

  return function(collaboration, message, callback) {

    if (!message || message.objectType !== 'organizational') {
      logger.debug('Message is not organizational one, skipping');
      return;
    }

    var out = collaboration.members;
    var recipients = message.recipients || [];

    async.map(recipients, function(recipient, callback) {
      if (recipient.objectType === 'company') {
        return getUsersInCompany(collaboration, recipient.id, callback);
      } else {
        logger.debug('Recipient is not a company');
        return callback();
      }
    }, function(err, results) {
      results.forEach(function(result) {
        var members = result.map(function(result) {
          return {
            member: {
              objectType: 'user',
              id: result._id + ''
            }
          };
        });
        out = out.concat(members);
      });
      return callback(null, out);
    });
  };
};
