'use strict';

var q = require('q');

module.exports = function(dependencies) {
  var jobQueue = dependencies('jobqueue');
  var contactModule = dependencies('contact');
  var logger = dependencies('logger');
  var pubsub = dependencies('pubsub').global;
  var importerRegistry = require('./registry')(dependencies);
  var helper = require('./helper')(dependencies);
  var CONTACT_IMPORT_ERROR = require('../constants').CONTACT_IMPORT_ERROR;

  var IMPORT_ACCOUNT_ERROR = CONTACT_IMPORT_ERROR.ACCOUNT_ERROR;
  var IMPORT_API_CLIENT_ERROR = CONTACT_IMPORT_ERROR.API_CLIENT_ERROR;
  var IMPORT_CONTACT_CLIENT_ERROR = CONTACT_IMPORT_ERROR.CONTACT_CLIENT_ERROR;

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

  function buildErrorMessage(type, errorObject) {
    if (type === IMPORT_API_CLIENT_ERROR && errorObject.statusCode) {
      var statusCode = errorObject.statusCode;
      if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
        type = IMPORT_ACCOUNT_ERROR;
      }
    }

    return {
      type: type,
      errorObject: errorObject
    };
  }

  function createContact(vcard, options) {
    var contactId = vcard.getFirstPropertyValue('uid');
    var jsonCard = vcard.toJSON();
    return contactModule.lib.client({ ESNToken: options.esnToken })
      .addressbookHome(options.user._id)
      .addressbook(options.addressbook.id)
      .vcard(contactId)
      .create(jsonCard)
      .then(function() {
        pubsub.topic('contacts:contact:add').publish({
          contactId: contactId, 
          bookHome: options.user._id + '',
          bookName: options.addressbook.id,
          bookId: options.user._id + '',
          vcard: jsonCard,
          user: { _id: options.user._id }
        });
      }, function(err) {
        logger.error('Error while inserting contact to DAV', err);
        return q.reject(buildErrorMessage(IMPORT_CONTACT_CLIENT_ERROR, err));
      });
  }

  return {
    importAccountContacts: importAccountContacts,
    importAccountContactsByJobQueue: importAccountContactsByJobQueue,
    synchronizeAccountContacts: synchronizeAccountContacts,
    synchronizeAccountContactsByJobQueue: synchronizeAccountContactsByJobQueue,
    createContact: createContact,
    buildErrorMessage: buildErrorMessage

  };
};
