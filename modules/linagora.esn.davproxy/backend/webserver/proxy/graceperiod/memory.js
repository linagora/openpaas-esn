'use strict';

const DEV_DELAY = 1000;
const client = require('../http-client');
const extend = require('extend');
const http = require('http');

module.exports = dependencies => {
  const graceperiod = dependencies('graceperiod');
  const logger = dependencies('logger');

  return (req, res, options) => {
    const target = `${options.endpoint}/${options.path}${req.url}`;
    const delay = getDelay(options.graceperiod);
    const context = { user: req.user._id };

    function forwardRequest(callback) {
      const requestOptions = {
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

      client(requestOptions, (err, response, body) => {
        if (err) {
          logger.error('Error while sending request', err);

          if (options.onError) {
            return options.onError(response, body, req, res, callback.bind(null, new Error('Error while sending request')));
          }

          return callback(new Error('Error while sending request'));
        }

        logger.info('Response from remote service: HTTP %s', response.statusCode);

        let error;

        if (response.statusCode >= 200 && response.statusCode < 300) {
          if (options.onSuccess) {
            return options.onSuccess(response, body, req, res, callback.bind(null, null, response));
          }
        } else {
          error = {error: {code: response.statusCode, message: http.STATUS_CODES[response.statusCode], details: response.statusMessage}};
          logger.error(`Error from remote service : ${response.body}`);
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

    graceperiod.create(forwardRequest, delay, context, onComplete, onCancel).then(task => {
      logger.info('Grace Task %s has been created for %s', task.id, target);
      res.set('X-ESN-Task-Id', task.id);
      res.status(202).json({id: task.id});
    }, function(err) {
      logger.error('Error while creating deferred task', err);
      res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Can not get create deferred task'}});
    });
  };

  function getDelay(delay) {
    return process.env.NODE_ENV === 'dev' ? DEV_DELAY : delay;
  }
};
