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
  var importerRegistry = require('../registry')(dependencies);

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

  function getAllImporterTypes() {
    return q(Object.keys(importerRegistry.list()));
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

  function getUserAccountsForTypes(users, types) {
    var userAccounts = [];
    users.forEach(function(user) {
      var accounts = user.accounts.filter(function(account) {
        return (account.data && types.indexOf(account.data.provider) > -1);
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

  function createContactSyncJob() {
    var job = function(callback) {
      q.all([getAllUsers(), getAllImporterTypes()])
        .then(function(data) {
          var users = data[0];
          var importerTypes = data[1];
          logger.debug('Fetched %d users and %d importer(s)', users.length, importerTypes.length);
          return getUserAccountsForTypes(users, importerTypes);
        })
        .then(function(userAccounts) {
          return q.allSettled(userAccounts.map(function(userAccount) {
            return q.allSettled(userAccount.accounts.map(function(account) {
              logger.info('Start synchronize contacts for user %s, account %s', userAccount.user._id, account.data.id);
              return importModule.synchronizeAccountContactsByJobQueue(userAccount.user, account);
            }));
          }));
        })
        .then(callback.bind(null, null), callback);
    };

    var onComplete = function() {
      logger.info('Contact Synchronization job has been completed');
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

  function init() {
    if (!isActive()) {
      logger.info('Contact Synchronization is not active');
      return q.reject(new Error('Contact Synchronization is not active'));
    }
    return createContactSyncJob();
  }

  return {
    init: init
  };
};
