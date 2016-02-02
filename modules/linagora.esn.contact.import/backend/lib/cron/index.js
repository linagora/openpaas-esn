'use strict';

var q = require('q');
var DEFAULT_TIMECRON = '00 00 00 * * *';
var DEFAULT_DESCRIPTION = 'Contact Synchronization';

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var userModule = dependencies('user');
  var config = dependencies('config')('cronjob');
  var cron = dependencies('cron');
  var importModule = require('../import')(dependencies);

  function getCronExpression() {
    if (!config || !config.contactsync || !config.contactsync.expression) {
      return DEFAULT_TIMECRON;
    }
    return config.contactsync.expression;
  }

  function isActive() {
    return (config && config.contactsync && config.contactsync.active);
  }

  function getCronDescription() {
    return config && config.contactsync && config.contactsync.description ? config.contactsync.description : DEFAULT_DESCRIPTION;
  }

  function getAllUsers() {
    var deferred = q.defer();

    userModule.list(function(err, users) {
      if (err) {
        return deferred.reject(err);
      }
      deferred.resolve(users);
    });

    return deferred.promise;
  }

  function getUserAccountsForType(users, type) {
    var userAccounts = [];
    users.forEach(function(user) {
      var accounts = user.accounts.filter(function(account) {
        // TODO: should only get accounts that have been imported contacts
        return (account.data && account.data.provider === type);
      });
      if (accounts.length > 0) {
        userAccounts.push({
          user: user,
          accounts: accounts
        });
      }
    });
    return q(userAccounts);
  }

  function createContactSyncJob(type) {
    var job = function(callback) {
      getAllUsers()
        .then(function(users) {
          logger.debug('Fetched %d users', users.length);
          return getUserAccountsForType(users, type);
        })
        .then(function(userAccounts) {
          logger.info('Synchronizing contacts for %d users', userAccounts.length);
          return q.allSettled(userAccounts.map(function(userAccount) {
            return q.allSettled(userAccount.accounts.map(function(account) {
              logger.info('Start synchronize contacts for user %s, account %s', userAccount.user._id, account.data.id);
              return importModule.importAccountContactsByJobQueue(userAccount.user, account);
            }));
          }));
        })
        .then(callback.bind(null, null), callback);
    };

    var onComplete = function() {
      logger.info('Contact Synchronization job has been complete');
    };

    var deferred = q.defer();
    cron.submit(getCronDescription(), getCronExpression(), job, onComplete, function(err, job) {
      if (err) {
        logger.error('Error while submitting the Contact Synchronization job', err);
        return deferred.reject(err);
      }
      logger.info('Contact Synchronization job has been submitted', job.id);
      deferred.resolve(job.id);
    });
    return deferred.promise;
  }

  function init(accountType) {
    if (!isActive()) {
      logger.info('Contact Synchronization is not active');
      return q.reject(new Error('Contact Synchronization is not active'));
    }
    return createContactSyncJob(accountType);
  }

  return {
    init: init
  };
};
