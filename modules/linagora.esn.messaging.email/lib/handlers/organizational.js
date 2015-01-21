'use strict';

var async = require('async');

module.exports = function(lib, dependencies) {

  var userModule = dependencies('user');
  var domainModule = userModule.domain;
  var userHelper = userModule.helpers.user;
  var logger = dependencies('logger');

  function sendMessageAsEMail(from, user, message, callback) {
    var mail = dependencies('email');
    var data = {
      message: message.content,
      firstname: user.firstname,
      lastname: user.lastname
    };
    return mail.sendHTML(from, user.emails[0], message.title || 'New Org Message', 'new-orgmessage-notification', data, callback);
  }

  function sendResponseAsEmail(from, user, message, callback) {
    return callback(new Error('Not implemented'));
  }

  function replyFromEMail(message, callback) {
    return callback(new Error('Not implemented'));
  }

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

  function getUsersForMessage(collaboration, message, options, callback) {
    var recipients = message.recipients || [];

    async.concat(recipients, function(recipient, done) {
      if (recipient.objectType === 'company') {
        return getUsersInCompany(collaboration, recipient.id, function(err, users) {
          if (err) {
            logger.warning('Error while getting users in company %s: %e', recipient.id, err);
            return done();
          }

          users = users.map(function(user) {
            return {
              user: user,
              data: {
                recipient: recipient
              }
            };
          });

          return done(null, users);
        });
      } else {
        logger.debug('Recipient is not a company');
        return done();
      }
    }, callback);
  }

  return {
    sendMessageAsEMail: sendMessageAsEMail,
    sendResponseAsEmail: sendResponseAsEmail,
    replyFromEMail: replyFromEMail,
    getUsersForMessage: getUsersForMessage
  };
};

