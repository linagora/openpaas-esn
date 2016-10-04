'use strict';

module.exports = function(lib, dependencies) {

  var logger = dependencies('logger');

  function cancel(req, res) {
    logger.debug('Cancelling task');
    var task = req.task;
    if (!task) {
      return res.status(404).json({error: {code: 404, message: 'Not found', details: 'Task not found'}});
    }

    task.cancel();
    return res.status(204).end();
  }

  function flush(req, res) {
    logger.debug('Flushing task');
    var task = req.task;
    if (!task) {
      return res.status(404).json({error: {code: 404, message: 'Not found', details: 'Task not found'}});
    }

    task.flush();
    return res.status(204).end();
  }

  return {
    cancel: cancel,
    flush: flush
  };

};
