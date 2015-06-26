'use strict';

module.exports = function(lib, dependencies) {

  var logger = dependencies('logger');

  function cancel(req, res) {
    logger.debug('Cancelling task');
    var task = req.task;
    if (!task) {
      return res.send(500);
    }

    task.cancel();
    res.send(204);
  }

  return {
    cancel: cancel
  };

};
