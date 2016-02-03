'use strict';

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var webserverWrapper = dependencies('webserver-wrapper');
  var jobQueue = dependencies('jobqueue');

  var webserver = require('../webserver')(dependencies);
  var importerRegistry = require('./registry')(dependencies);
  var importModule = require('./import')(dependencies);
  var cron = require('./cron')(dependencies);

  function startContactSyncCronJob(importer) {
    return cron.init(importer.name);
  }

  function addImporter(importer) {
    if (!importer) {
      logger.error('Can not add empty importer');
      return;
    }
    importerRegistry.add(importer);
    logger.debug('Adding the %s importer', importer.name);
    startContactSyncCronJob(importer);

    jobQueue.lib.workers.add({
      name: 'contact-' + importer.name + '-sync',
      getWorkerFunction: function() {
        return function(data) {
          return importModule.synchronizeAccountContacts(data.user, data.account);
        };
      }
    });

    jobQueue.lib.workers.add({
      name: 'contact-' + importer.name + '-import',
      getWorkerFunction: function() {
        return function(data) {
          return importModule.importAccountContacts(data.user, data.account);
        };
      }
    });

    webserverWrapper.injectAngularModules('contact.import.' + importer.name, importer.frontend.modules, importer.frontend.moduleName, ['esn']);
    webserverWrapper.addApp('contact.import.' + importer.name, webserver.getStaticApp(importer.frontend.staticPath));
  }

  return {
    addImporter: addImporter,
    import: importModule,
    cron: cron
  };
};
