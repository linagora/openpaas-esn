'use strict';

var q = require('q');

var TECHNICAL_USER_TYPE = 'dav';
var TOKEN_TTL = 20000;

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var webserverWrapper = dependencies('webserver-wrapper');
  var technicalUser = dependencies('technical-user');

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

  function getImporterOptions(user, account) {
    var defer = q.defer();

    var options = {
      account: account,
      user: user
    };

    technicalUser.findByTypeAndDomain(TECHNICAL_USER_TYPE, user.domains[0].domain_id, function(err, users) {
      if (err) {
        return defer.reject(err);
      }

      if (!users || !users.length) {
        return defer.reject(new Error('Can not find technical user for contact import'));
      }

      technicalUser.getNewToken(users[0], TOKEN_TTL, function(err, token) {
        if (err) {
          return defer.reject(err);
        }

        if (!token) {
          return defer.reject(new Error('Can not generate token for contact import'));
        }

        options.esnToken = token.token;
        defer.resolve(options);
      });
    });

    return defer.promise;
  }

  function importAccountContacts(user, account) {

    var importer = importers.get(account.data.provider);
    if (!importer || !importer.lib || !importer.lib.importer) {
      return q.reject(new Error('Can not find importer ' + account.data.provider));
    }

    return getImporterOptions(user, account).then(importer.lib.importer.importContact);
  }

  return {
    importers: importers,
    addImporter: addImporter,
    importAccountContacts: importAccountContacts,
    getImporterOptions: getImporterOptions
  };
};
