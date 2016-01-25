'use strict';

module.exports = function(dependencies) {

  var workers = {};
  var logger = dependencies('logger');

  function add(worker) {

    if (!worker || !worker.name) {
      return logger.error(new Error('Can not add importer. You need to define it and its name'));
    } else if (typeof worker.getWorkerFunction !== 'function' || typeof worker.getWorkerFunction() !== 'function') {
      return logger.error(new Error('Can not add importer without worker function'));
    }

    logger.debug('Adding the %s worker', worker.name);
    workers[worker.name] = worker;
  }

  function get(type) {
    return workers[type];
  }

  function list() {
    return workers;
  }

  return {
    add: add,
    get: get,
    list: list
  };
};
