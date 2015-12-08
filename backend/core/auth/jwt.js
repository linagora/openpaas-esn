'use strict';

var jwt = require('jsonwebtoken');
var esnConfig = require('../esn-config');

module.exports.getWebTokenSecret = function(callback) {
  esnConfig('jwtSecret').get(function(err, config) {
    if (err) {
      return callback(err);
    }
    if (config && config.secret) {
      return callback(null, config && config.secret);
    }
    var uuid = require('node-uuid').v4();
    return esnConfig('jwtSecret').store({secret: uuid}, function() {
      if (err) {
        return callback(err);
      }
      return callback(null, uuid);
    });
  });
};

module.exports.generateWebToken = function(payload, callback) {
  if (!payload) {
    return callback(new Error('Payload is required to generated a JWT.'));
  }
  this.getWebTokenSecret(function(err, secret) {
    if (err) {
      return callback(err);
    }
    jwt.sign(payload, secret, {}, function(token) {
      return callback(null, token);
    });
  });
};

