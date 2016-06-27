'use strict';

var q = require('q');
var userModule = require('../../user');
var logger = require('../../logger');
var getUserAsActor = require('../../activitystreams/helpers').getUserAsActor;

function handler(entry) {
  var defer = q.defer();

  if (entry.target && entry.target.length && entry.target[0].objectType === 'user') {
    userModule.get(entry.target[0]._id, function(err, user) {
      if (err) {
        logger.info('Error while getting user from timeline entry target', err);
        return defer.resolve(entry);
      }

      if (!user) {
        logger.info('Can not find valid user from timeline entry target');
        return defer.resolve(entry);
      }

      entry.target[0] = getUserAsActor(user);
      return defer.resolve(entry);
    });
  } else {
    defer.resolve(entry);
  }
  return defer.promise;
}

module.exports = function() {
  return {
    verb: 'follow',
    handler: handler
  };
};
