'use strict';

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var importers = require('./importers')(dependencies);

  function start(callback) {
    logger.info('Starting the contacts import module');
    var webserverWrapper = dependencies('webserver-wrapper');
    var webserver = require('../webserver')(dependencies);

    var contactImporters = importers.list();
    Object.keys(contactImporters).forEach(function(type) {
      logger.debug('Adding the %s importer', type);
      var importer = contactImporters[type];
      webserverWrapper.injectAngularModules('contact.import.' + importer.name, importer.frontend.modules, importer.frontend.moduleName, ['esn']);
      webserverWrapper.addApp('contact.import.' + importer.name, webserver.getStaticApp(importer.frontend.staticPath));
    });
    callback();
  }

  return {
    importers: importers,
    start: start
  };
};
