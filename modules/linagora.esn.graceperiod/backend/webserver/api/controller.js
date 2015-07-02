'use strict';

module.exports = function(lib, dependencies) {

  var logger = dependencies('logger');

  function cancel(req, res) {
    logger.debug('Cancelling task');
    var task = req.task;
    if (!task) {
      return res.json(404, {error: {code: 404, message: 'Not found', details: 'Task not found'}});
    }

    task.cancel();
    return res.send(204);
  }

  return {
    cancel: cancel
  };

};
