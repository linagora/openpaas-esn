'use strict';

var q = require('q');

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var webserverWrapper = dependencies('webserver-wrapper');

  var webserver = require('../webserver')(dependencies);
  var importers = require('./importers')(dependencies);
  var helper = require('./helper')(dependencies);

  function addImporter(importer) {
    if (!importer) {
      logger.error('Can not add empty importer');
      return;
    }
    importers.add(importer);
    logger.debug('Adding the %s importer', importer.type);
    webserverWrapper.injectAngularModules('contact.import.' + importer.name, importer.frontend.modules, importer.frontend.moduleName, ['esn']);
    webserverWrapper.addApp('contact.import.' + importer.name, webserver.getStaticApp(importer.frontend.staticPath));
  }

  function importAccountContacts(user, account) {

    var importer = importers.get(account.data.provider);
    if (!importer || !importer.lib || !importer.lib.importer) {
      return q.reject(new Error('Can not find importer ' + account.data.provider));
    }

    return helper.getImporterOptions(user, account)
      .then(helper.initializeAddressBook)
      .then(importer.lib.importer.importContact);
  }

  return {
    importers: importers,
    addImporter: addImporter,
    importAccountContacts: importAccountContacts
  };
};
