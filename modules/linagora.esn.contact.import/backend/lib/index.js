module.exports = dependencies => {
  const logger = dependencies('logger');
  const webserverWrapper = dependencies('webserver-wrapper');
  const jobQueue = dependencies('jobqueue');

  const webserver = require('../webserver')(dependencies);
  const importerRegistry = require('./registry')(dependencies);
  const importModule = require('./import')(dependencies);
  const cron = require('./cron')(dependencies);

  const importContactsWorker = require('./workers/import')(dependencies);
  const synchronizeContactsWorker = require('./workers/synchronize')(dependencies);

  return {
    addImporter,
    import: importModule,
    init
  };

  function init() {
    cron.init();
    jobQueue.lib.addWorker(importContactsWorker);
    jobQueue.lib.addWorker(synchronizeContactsWorker);
  }

  function addImporter(importer) {
    if (!importer) {
      logger.error('Can not add empty importer');

      return;
    }

    importerRegistry.add(importer);
    logger.debug('Adding the %s importer', importer.name);

    webserverWrapper.injectAngularModules('contact.import.' + importer.name, importer.frontend.modules, importer.frontend.moduleName, ['esn']);
    webserverWrapper.addApp('contact.import.' + importer.name, webserver.getStaticApp(importer.frontend.staticPath));
  }
};
