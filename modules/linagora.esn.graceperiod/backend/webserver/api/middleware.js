'use strict';

module.exports = function(lib, dependencies) {

  var logger = dependencies('logger');

  function load(req, res, next) {
    lib.registry.get(req.params.id).then(function(task) {

      if (!task) {
        return res.json(404);
      }

      req.task = task;
      next();

    }, function(err) {
      logger.error('Error while retrieving task', err);
      return res.json(500);
    });
  }

  function isUserTask(req, res, next) {
    return next();
  }

  return {
    load: load,
    isUserTask: isUserTask
  };
};
