'use strict';

var q = require('q');
var userModule = require('../../user');
var getUserAsActor = require('../../activitystreams/helpers').getUserAsActor;
var VERB = 'follow';

var FOLLOW_NOTIFICATION = 'resource:link:follow:user';
module.exports.FOLLOW_NOTIFICATION = FOLLOW_NOTIFICATION;

function toTimelineEntry(link, follower, following) {
  return q({
    verb: VERB,
    published: link.timestamps.creation || Date.now(),
    actor: getUserAsActor(follower),
    object: {
      objectType: 'user',
      _id: follower._id
    },
    target: [{
      objectType: 'user',
      _id: String(following._id)
    }]
  });
}

function handler(link) {
  return q.all([q.denodeify(userModule.get)(link.source.id), q.denodeify(userModule.get)(link.target.id)]).spread(function(follower, following) {
    return toTimelineEntry(link, follower, following);
  });
}
module.exports.handler = handler;
