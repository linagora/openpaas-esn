'use strict';

module.exports = function(lib, dependencies) {

  var logger = dependencies('logger');
  var token = dependencies('auth').token;

  function load(req, res, next) {
    lib.registry.get(req.params.id).then(function(task) {

      if (!task) {
        return res.json(404, {error: {code: 404, message: 'Not found', details: 'Task not found'}});
      }

      req.task = task;
      next();

    }, function(err) {
      logger.error('Error while retrieving task', err);
      return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Error while retrieving task'}});
    });
  }

  function isUserTask(req, res, next) {
    var task = req.task;
    if (!task) {
      return res.json(404, {error: {code: 404, message: 'Not found', details: 'Task not found'}});
    }

    var id = task.id;
    token.getToken(id, function(err, data) {

      if (err) {
        logger.error('Error while getting token from id %s', id, err);
        return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Error while retrieving task'}});
      }

      if (!data) {
        logger.debug('Can not retrieve token %s', id);
        return res.json(404, {error: {code: 404, message: 'Not found', details: 'Task not found'}});
      }

      if (req.user._id + '' !== data.user) {
        return res.json(403, {error: {code: 403, message: 'Forbidden', details: 'User does not have enough rights to access this task'}});
      }

      return next();
    });

  }

  return {
    load: load,
    isUserTask: isUserTask
  };
};
