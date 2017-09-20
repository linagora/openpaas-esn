'use strict';

const DEV_DELAY = 1000;
var client = require('../http-client');
var extend = require('extend');
var http = require('http');

module.exports = function(dependencies) {

  var graceperiod = dependencies('graceperiod');
  var logger = dependencies('logger');

  return function(req, res, options) {

    var target = options.endpoint + '/' + options.path + req.url;
    var delay = getDelay(options.graceperiod);
    var context = {
      user: req.user._id
    };

    function forwardRequest(callback) {
      var requestOptions = {
        method: req.method,
        url: target,
        headers: extend({}, req.headers, { ESNToken: req.token.token })
      };

      if (options.json) {
        requestOptions.json = options.json;
      }

      if (req.body && req.method !== 'DELETE') {
        requestOptions.body = req.body;
      }

      client(requestOptions, function(err, response, body) {
        if (err) {
          logger.error('Error while sending request', err);

          if (options.onError) {
            return options.onError(response, body, req, res, callback.bind(null, new Error('Error while sending request')));
          }

          return callback(new Error('Error while sending request'));
        }

        logger.info('Response from remote service: HTTP %s', response.statusCode);

        var error;
        if (response.statusCode >= 200 && response.statusCode < 300) {
          if (options.onSuccess) {
            return options.onSuccess(response, body, req, res, callback.bind(null, null, response));
          }
        } else {
          error = {error: {code: response.statusCode, message: http.STATUS_CODES[response.statusCode], details: response.statusMessage}};
          logger.error('Error from remote service : ', response.body);
          if (options.onError) {
            return options.onError(response, body, req, res, callback.bind(null, error, response));
          }
        }

        callback(error, response);
      });
    }

    function onComplete(err, result) {
      logger.debug('Task has been completed');
      if (err) {
        logger.error('Error while sending request to remote service', err);
      }
      if (result) {
        logger.info('Remote service response status code', result.statusCode);
      }
    }

    function onCancel() {
      logger.info('Task has been aborted');
    }

    graceperiod.create(forwardRequest, delay, context, onComplete, onCancel).then(function(task) {
      logger.info('Grace Task %s has been created for %s', task.id, target);
      res.set('X-ESN-Task-Id', task.id);
      return res.status(202).json({id: task.id});
    }, function(err) {
      logger.error('Error while creating deferred task', err);
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Can not get create deferred task'}});
    });
  };

  function getDelay(delay) {
    return process.env.NODE_ENV === 'dev' ? DEV_DELAY : delay;
  }
};
