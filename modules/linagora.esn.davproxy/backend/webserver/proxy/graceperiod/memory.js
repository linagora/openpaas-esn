'use strict';

var client = require('../http-client');

module.exports = function(dependencies) {

  var graceperiod = dependencies('graceperiod');
  var logger = dependencies('logger');

  return function(req, res, options) {

    var target = options.endpoint + '/' + options.path + req.url;
    var delay = options.graceperiod;
    var context = {
      user: req.user._id
    };

    function forwardRequest(callback) {

      var requestOptions = {
        method: req.method,
        url: target,
        headers: {
          'ESNToken': req.token.token
        }
      };

      if (req.body && req.method !== 'DELETE') {
        requestOptions.body = req.body;
      }

      client(requestOptions, function(err, response, body) {
        if (err) {
          logger.error('Error while sending request', err);

          if (options.onError) {
            return options.onError(response, body, req, res, function() {
              callback(new Error('Error while sending request'));
            });
          }

          return callback(new Error('Error while sending request'));
        }

        logger.info('Response from remote service: HTTP %s', response.statusCode);

        if (options.onSuccess) {
          return options.onSuccess(response, body, req, res, function() {
            callback(null, response);
          });
        }

        callback(null, response);
      });
    }

    function onComplete(err, result) {
      logger.debug('Task has been completed');
      if (err) {
        logger.error('Error while sending request to remote service', err);
      }
      if (result) {
        logger.info('Remote service response', result);
      }
    }

    function onCancel() {
      logger.info('Task has been aborted');
    }

    graceperiod.create(forwardRequest, delay, context, onComplete, onCancel).then(function(task) {
      logger.info('Grace Task %s has been created for %s', task.id, target);
      res.set('X-ESN-Task-Id', task.id);
      return res.json(202, {id: task.id});
    }, function(err) {
      logger.error('Error while creating deferred task', err);
      return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Can not get create deferred task'}});
    });
  };
};
