'use strict';

var q = require('q');
var userModule = require('../../user');
var logger = require('../../logger');
var getUserAsActor = require('../../activitystreams/helpers').getUserAsActor;
var CONSTANTS = require('../../user/constants');

function handler(entry) {
  var defer = q.defer();

  if (entry.object && entry.object.objectType === CONSTANTS.OBJECT_TYPE) {
    userModule.get(entry.object._id, function(err, user) {
      if (err) {
        logger.info('Error while getting user from timeline entry object', err);
        return defer.resolve(entry);
      }

      if (!user) {
        logger.info('Can not find valid user from timeline entry object');
        return defer.resolve(entry);
      }

      entry.object = getUserAsActor(user);
      return defer.resolve(entry);
    });
  } else {
    defer.resolve(entry);
  }
  return defer.promise;
}

module.exports = function() {
  return {
    verb: 'unfollow',
    handler: handler
  };
};
