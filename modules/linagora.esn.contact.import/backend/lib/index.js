'use strict';

var q = require('q');

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var webserverWrapper = dependencies('webserver-wrapper');

  var webserver = require('../webserver')(dependencies);
  var importers = require('./importers')(dependencies);

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

  function importContacts(options) {

    var accountId = options.accountId;
    var type = options.type;
    var user = options.user;

    var accounts = user.accounts.filter(function(account) {
      return (account.data && account.data.provider === type && account.data.id === accountId);
    });

    if (!accounts || !accounts.length) {
      return q.reject(new Error('No valid account found'));
    }

    var defer = q.defer();
    var importer = importers.get(options.type);
    if (!importer || !importer.lib || !importer.lib.importer) {
      defer.reject(new Error('Can not find importer'));
    } else {
      importer.lib.importer.importContact({
        type: options.type,
        account: accounts[0],
        user: user
      }).then(defer.resolve, defer.reject);
    }
    return defer.promise;
  }

  return {
    importers: importers,
    addImporter: addImporter,
    importContacts: importContacts
  };
};
