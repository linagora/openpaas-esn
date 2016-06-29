'use strict';

var q = require('q');
var userModule = require('../../user');
var getUserAsActor = require('../../activitystreams/helpers').getUserAsActor;
var CONSTANTS = require('../../user/constants');
var VERB = 'unfollow';

var UNFOLLOW_NOTIFICATION = 'resource:link:follow:user:remove';
module.exports.UNFOLLOW_NOTIFICATION = UNFOLLOW_NOTIFICATION;

function toTimelineEntry(follower, following) {
  return q({
    verb: VERB,
    published: Date.now(),
    actor: getUserAsActor(follower),
    object: {
      objectType: CONSTANTS.OBJECT_TYPE,
      _id: following._id
    },
    target: [{
      objectType: CONSTANTS.OBJECT_TYPE,
      _id: String(following._id)
    }]
  });
}

function handler(link) {
  return q.all([q.denodeify(userModule.get)(link.source.id), q.denodeify(userModule.get)(link.target.id)]).spread(function(follower, following) {
    return toTimelineEntry(follower, following);
  });
}
module.exports.handler = handler;
