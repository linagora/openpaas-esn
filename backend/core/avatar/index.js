'use strict';

var async = require('async');

var avatarProviders = {};

module.exports.registerProvider = function(type, avatarProvider) {
  avatarProviders[type] = avatarProvider;
};

module.exports.getAvatarFromEmail = function(email, callback) {
  var objectForEmail, type;
  var types = Object.keys(avatarProviders);
  async.whilst(
    function() {
      return !objectForEmail && types.length > 0;
    },
    function(callback) {
      type = types.shift();
      avatarProviders[type].findByEmail(email, function(err, result) {
        if (err) {
          return callback(err);
        }
        if (result) {
          objectForEmail = result;
        }
        return callback();
      });
    },
    function(err) {
      if (err) {
        return callback(err);
      }
      if (!objectForEmail) {
        return callback();
      }

      return callback(null, objectForEmail, avatarProviders[type].getAvatar);
    });
};
