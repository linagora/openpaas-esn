'use strict';

module.exports = dependencies => {
  const workers = {};
  const logger = dependencies('logger');

  return {
    add,
    get,
    list
  };

  function add(worker) {
    if (!worker || !worker.name) {
      return logger.error(new Error('Can not add importer. You need to define it and its name'));
    } else if (typeof worker.getWorkerFunction !== 'function' || typeof worker.getWorkerFunction() !== 'function') {
      return logger.error(new Error('Can not add importer without worker function'));
    }

    logger.debug(`Adding the ${worker.name}`);
    workers[worker.name] = worker;
  }

  function get(type) {
    return workers[type];
  }

  function list() {
    return workers;
  }
};
