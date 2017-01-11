'use strict';

const authtoken = require('../../core/auth/token');
const helper = require('../helper/socketio');

module.exports = function(socket, callback) {
  const infos = helper.getInfos(socket);

  if (!infos || !infos.query) {
    return callback(new Error('Invalid socket object passed in argument'));
  }

  const query = infos.query;

  if (!query.token || !query.user) {
    return callback(new Error('Token or user not found'));
  }

  authtoken.getToken(query.token, (err, data) => {
    if (err || !data) {
      return callback(new Error('No data from token system'));
    }

    if (query.user !== data.user) {
      return callback(new Error('Bad user'));
    }

    helper.setUserId(socket, data.user);

    callback();
  });
};
