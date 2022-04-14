'use strict';

const jwtAuth = require('../../core/auth/jwt');
const helper = require('../helper/socketio');
const jwt = require('jsonwebtoken');
const userModule = require('../../core/user');
const logger = require('../../core/logger');

module.exports = (socket, callback) => {
  const infos = helper.getInfos(socket);

  if (!infos || !infos.query) {
    return callback(new Error('invalid socket object'));
  }

  if (!infos.query.token) {
    return callback(new Error('missing JWT'));
  }

  const { token } = infos.query;

  return jwtAuth.getWebTokenConfig((err, config) => {
    if (err) {
      logger.error('socketIO', 'Error while getting jwt config', err);

      return callback(new Error('No jwt config found'));
    }

    return jwt.verify(token, config.publicKey,
      { algorithms: [config.algorithm], ignoreExpiration: true },
      (err, decoded) => {
        if (err || !decoded) {
          logger.error('socketIO', 'error while verifying jwt', err);

          return callback(new Error('Invalid jwt'));
        }

        const { sub } = decoded;

        if (!sub) {
          return callback(new Error('sub is required in the JWT payload'));
        }

        return userModule.findByEmail(sub, (err, user) => {
          if (err || !user) {
            logger.error('socketIO', 'error while finding user', err);

            return callback(new Error('User not found'));
          }

          helper.setUserId(socket, user.id);

          callback();
        });
      }
    );
  });
};
