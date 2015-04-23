'use strict';

var thing;

/**
 * Return one single thing from the backend coded in the core
 * @param req - http request object
 * @param res - http response object
 */
function getOne(dependencies, req, res) {
  var logger = dependencies('logger');
  var errors = dependencies('errors');

  thing.getOne(req.params.id).then(function(thing) {
    if (!thing) {
      return errors.send(res, 404, 'Not Found', 'No thing have been found');
    }

    logger.debug('Successufully retrieve thing and send it back to client', thing);
    return res.json(200, thing);
  }, function(err) {
    return errors.send(res, 500, 'Server Error', err.message);
  });
}

/**
 * Create a new thing inside the backend coded in the core
 * @param req - http request object
 * @param res - http response object
 */
function create(dependencies, req, res) {
  var logger = dependencies('logger');
  var errors = dependencies('errors');

  thing.create(req.body).then(function (saved) {
    logger.debug('Successufully created a new thing and send back the id to client', saved);
    return res.json(201, { id: saved._id });
  }, function (err) {
    return errors.send(res, 500, 'Server Error', err.message);
  });
}

/**
 * Remove a thing from the backend coded in the core
 * @param req - http request object
 * @param res - http response object
 */
function remove(dependencies, req, res) {
  var logger = dependencies('logger');
  var errors = dependencies('errors');

  thing.remove(req.params.id)
    .then(function(thing) {
      if (!thing) {
        return errors.send(res, 404, 'Not Found', 'No thing have been found');
      }
      return thing.remove(req.params.id);
    })
    .then(function (removed) {
      logger.debug('Successufully removed a thing and send back the id to client', removed);
      return res.json(200, { id: saved._id })
    })
    .catch(function (err) {
      return errors.send(res, 500, 'Server Error', err.message);
    });
}

module.exports = function(dependencies) {
  thing = require('./thing.core')(dependencies);
  return {
    getOne: getOne.bind(null, dependencies),
    create: create.bind(null, dependencies),
    remove: remove.bind(null, dependencies)
  };
};
