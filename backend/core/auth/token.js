'use strict';

var redis = require('../db/redis');
var logger = require('../logger');
var esnconfig = require('../esn-config');
var jwt = require('jsonwebtoken');

var getNewToken = function(options, callback) {
  options = options || {};
  options.ttl = options.ttl || 60;
  redis.getClient(function(err, client) {

    if (err || !client) {
      return callback(new Error('Error while getting client'));
    }

    esnconfig('session').get(function(err, sessionconf) {
      if (err || !sessionconf || !sessionconf.secret) {
          return callback(err || new Error('Missing session configuration'));
      }

      options.created_at = new Date();
      var token = jwt.sign({
        user: options.user
      }, sessionconf.secret, {
        expiresInMinutes: Math.floor(options.ttl / 60),
        algorithm: 'HS512'
      });

      options.token = token;

      client.setex(options.token, options.ttl, JSON.stringify(options), function(err) {
        if (err) {
          return callback(err);
        }
        return callback(null, options);
      });
    });
  });
};
module.exports.getNewToken = getNewToken;

/**
 * Validates a token
 *
 * @param {id} token
 * @param {function} callback - as fn(bool)
 */
var validateToken = function(token, callback) {
  redis.getClient(function(err, client) {
    if (err) {
      logger.error('Problem while getting redis client');
      return callback(false);
    }
    client.get(token, function(err, data) {
      if (err) {
        logger.error('Problem while getting redis data');
        return callback(false);
      }

      if (!data) {
        logger.debug('Data not found in redis');
        return callback(false);
      }

      return callback(true);
    });
  });
};
module.exports.validateToken = validateToken;

var getToken = function(token, callback) {
  redis.getClient(function(err, client) {
    if (err) {
      logger.error('Problem while getting redis client', err);
      return callback(err);
    }
    client.get(token, function(err, data) {
      if (err) {
        logger.error('Problem while getting redis data');
        return callback(err);
      }

      if (!data) {
        return callback();
      }

      return callback(null, JSON.parse(data));
    });
  });
};
module.exports.getToken = getToken;
