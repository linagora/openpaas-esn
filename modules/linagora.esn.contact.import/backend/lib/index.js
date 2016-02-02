'use strict';

var q = require('q');

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var webserverWrapper = dependencies('webserver-wrapper');
  var jobQueue = dependencies('jobqueue');

  var webserver = require('../webserver')(dependencies);
  var importers = require('./importers')(dependencies);
  var helper = require('./helper')(dependencies);

  function importAccountContacts(user, account) {

    var importer = importers.get(account.data.provider);
    if (!importer || !importer.lib || !importer.lib.importer) {
      return q.reject(new Error('Can not find importer ' + account.data.provider));
    }

    return helper.getImporterOptions(user, account)
      .then(helper.initializeAddressBook)
      .then(importer.lib.importer.importContact);
  }

  function synchronizeAccountContacts(user, account) {
    var importer = importers.get(account.data.provider);
    if (!importer || !importer.lib || !importer.lib.importer) {
      return q.reject(new Error('Can not find importer ' + account.data.provider));
    }

    return helper.getImporterOptions(user, account)
      .then(helper.initializeAddressBook)
      .then(function(options) {
        return importer.lib.importer.importContact(options)
          .then(helper.cleanOutdatedContacts.bind(null, options, Date.now()));
      });
  }

  function importAccountContactsByJobQueue(user, account) {
    var jobName = ['contact', account.data.provider, 'sync'].join('-');
    return jobQueue.lib.startJob(jobName, { user: user, account: account });
  }

  function addImporter(importer) {
    if (!importer) {
      logger.error('Can not add empty importer');
      return;
    }
    importers.add(importer);
    logger.debug('Adding the %s importer', importer.name);

    jobQueue.lib.workers.add({
      name: 'contact-' + importer.name + '-sync',
      getWorkerFunction: function() {
        return function(data) {
          return synchronizeAccountContacts(data.user, data.account);
        };
      }
    });

    webserverWrapper.injectAngularModules('contact.import.' + importer.name, importer.frontend.modules, importer.frontend.moduleName, ['esn']);
    webserverWrapper.addApp('contact.import.' + importer.name, webserver.getStaticApp(importer.frontend.staticPath));
  }

  return {
    importers: importers,
    addImporter: addImporter,
    importAccountContacts: importAccountContacts,
    synchronizeAccountContacts: synchronizeAccountContacts,
    importAccountContactsByJobQueue: importAccountContactsByJobQueue
  };
};
