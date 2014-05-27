'use strict';

var authtoken = require('../../core/auth/token');

module.exports = function(handshakeData, callback) {
  if (!handshakeData || !handshakeData.query || !handshakeData.query.token || !handshakeData.query.user) {
    return callback(new Error('Token or user not found'));
  }

  authtoken.getToken(handshakeData.query.token, function(err, data) {
    if (err || !data) {
      return callback(null, false);
    }

    if (handshakeData.query.user !== data.user) {
      return callback(new Error('Bad user'));
    }

    handshakeData.user = data.user;
    return callback(null, true);
  });
};
