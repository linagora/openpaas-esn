'use strict';

var importers = {};

module.exports = function(dependencies) {

  var logger = dependencies('logger');

  function add(importer) {
    logger.debug('Adding contact importer', importer);
    if (!importer || !importer.name) {
      return logger.error('Can not add importer. You need to define it and its name');
    }
    importers[importer.name] = importer;
  }

  function get(type) {
    return importers[type];
  }

  function list() {
    return importers;
  }

  return {
    add: add,
    get: get,
    list: list
  };
};
