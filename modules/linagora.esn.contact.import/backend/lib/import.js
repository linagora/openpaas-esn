'use strict';

var q = require('q');

module.exports = function(dependencies) {
  var jobQueue = dependencies('jobqueue');
  var pubsub = dependencies('pubsub').global;
  var importerRegistry = require('./registry')(dependencies);
  var helper = require('./helper')(dependencies);

  function importAccountContacts(user, account) {

    var importer = importerRegistry.get(account.data.provider);
    if (!importer || !importer.lib || !importer.lib.importer) {
      return q.reject(new Error('Can not find importer ' + account.data.provider));
    }

    return helper.getImporterOptions(user, account)
      .then(helper.initializeAddressBook)
      .then(importer.lib.importer.importContact);
  }

  function synchronizeAccountContacts(user, account) {
    var contactSyncTimeStamp = Date.now();
    var importer = importerRegistry.get(account.data.provider);
    if (!importer || !importer.lib || !importer.lib.importer) {
      return q.reject(new Error('Can not find importer ' + account.data.provider));
    }

    return helper.getImporterOptions(user, account)
      .then(helper.initializeAddressBook)
      .then(function(options) {
        return importer.lib.importer.importContact(options)
          .then(helper.cleanOutdatedContacts.bind(null, options, contactSyncTimeStamp))
          .then(function(data) {
            data.forEach(function(item) {
              if (!item.error) {
                pubsub.topic('contacts:contact:delete').publish({
                  contactId: item.cardId,
                  bookId: options.user._id,
                  bookName: options.addressbook.id
                });
              }
            });
          });
      });
  }

  function importAccountContactsByJobQueue(user, account) {
    var workerName = ['contact', account.data.provider, 'import'].join('-');
    var jobName = [workerName, user._id + '', account.data.id, Date.now()].join('-');
    return jobQueue.lib.submitJob(workerName, jobName, { user: user, account: account });
  }

  function synchronizeAccountContactsByJobQueue(user, account) {
    var workerName = ['contact', account.data.provider, 'sync'].join('-');
    var jobName = [workerName, user._id + '', account.data.id, Date.now()].join('-');
    return jobQueue.lib.submitJob(workerName, jobName, { user: user, account: account });
  }

  return {
    importAccountContacts: importAccountContacts,
    importAccountContactsByJobQueue: importAccountContactsByJobQueue,
    synchronizeAccountContacts: synchronizeAccountContacts,
    synchronizeAccountContactsByJobQueue: synchronizeAccountContactsByJobQueue
  };
};
