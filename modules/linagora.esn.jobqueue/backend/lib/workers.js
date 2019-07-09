module.exports = dependencies => {
  const workers = {};
  const logger = dependencies('logger');

  return {
    add,
    get,
    list
  };

  function add(worker = {}) {
    if (!worker.name) {
      throw new Error('worker.name is required');
    }

    if (!worker.handler) {
      throw new Error('worker.handler is required');
    }

    if (typeof worker.handler.handle !== 'function') {
      throw new Error('worker.handler.handle must be a function');
    }

    if (typeof worker.handler.getTitle !== 'function') {
      throw new Error('worker.handler.getTitle function is required');
    }

    logger.debug(`Jobqueue: adding worker ${worker.name}`);
    workers[worker.name] = worker;
  }

  function get(type) {
    return workers[type];
  }

  function list() {
    return workers;
  }
};
