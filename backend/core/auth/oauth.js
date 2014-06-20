'use strict';

var mongoose = require('mongoose');
var OAuthAccessToken = mongoose.model('OAuthAccessToken');

module.exports.findUserByToken = function(token, callback) {
  OAuthAccessToken.findOne({accessToken: token}).populate('userId').exec(function(err, accessToken) {
    if (err) {
      return callback(err);
    }

    if (accessToken && accessToken.userId) {
      return callback(null, accessToken.userId);
    }

    return callback();
  });
};
