'use strict';

var authtoken = require('../../core/auth/token');
var helper = require('../helper/socketio');

module.exports = function(socket, callback) {
  var infos = helper.getInfos(socket);
  if (!infos || !infos.query) {
    return callback(new Error('Invalid socket object passed in argument'));
  }
  var query = infos.query;
  if (!query.token || !query.user) {
    return callback(new Error('Token or user not found'));
  }

  authtoken.getToken(query.token, function(err, data) {
    if (err || !data) {
      return callback(new Error('No data from token system'));
    }
    if (query.user !== data.user) {
      return callback(new Error('Bad user'));
    }
    helper.setUserId(socket, data.user);
    return callback();
  });
};
