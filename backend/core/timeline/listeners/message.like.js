'use strict';

var q = require('q');
var userModule = require('../../user');
var messageModule = require('../../message');
var getUserAsActor = require('../../activitystreams/helpers').getUserAsActor;
var CONSTANTS = require('../../user/constants');

var VERB = 'like';

var LIKE_NOTIFICATION = 'resource:link:like:esn.message';
module.exports.LIKE_NOTIFICATION = LIKE_NOTIFICATION;

function toTimelineEntry(link, user, message) {
  return q({
    verb: VERB,
    language: message.language || '',
    published: link.timestamps.creation || Date.now(),
    actor: getUserAsActor(user),
    object: {
      objectType: message.objectType,
      _id: message._id
    },
    target: [{
      objectType: CONSTANTS.OBJECT_TYPE,
      _id: String(message.author._id)
    }]
  });
}

function handler(link) {
  return q.all([q.denodeify(userModule.get)(link.source.id), q.denodeify(messageModule.findByIds)([link.target.id])]).spread(function(user, messages) {
    return toTimelineEntry(link, user, messages[0]);
  });
}
module.exports.handler = handler;
