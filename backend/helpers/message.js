'use strict';

var localpubsub = require('../core/pubsub').local;
var globalpubsub = require('../core/pubsub').global;

module.exports.postToModelMessage = function(message, user) {
  var objectType = message.object.objectType,
      content = message.object.description,
      author = user._id,
      shares = message.targets;

  var result = {
    objectType: objectType,
    content: content,
    author: author,
    shares: shares
  };

  if (message.object.position) {
    result.position = message.object.position;
  }

  if (message.object.attachments) {
    result.attachments = message.object.attachments;
  }

  if (message.object.parsers) {
    result.parsers = message.object.parsers;
  }

  return result;
};

function messageSharesToTimelineTarget(shares) {
  return shares.map(function(e) {
    return {
      objectType: e.objectType,
      _id: e.id
    };
  });
}
module.exports.messageSharesToTimelineTarget = messageSharesToTimelineTarget;

module.exports.publishCommentActivity = function(user, inReplyTo, parentMessage, childMessage) {
  var targets = messageSharesToTimelineTarget(parentMessage.shares);
  var activity = require('../core/activitystreams/helpers').userMessageCommentToTimelineEntry(childMessage, 'post', user, targets, inReplyTo, new Date());
  localpubsub.topic('message:activity').publish(activity);
  globalpubsub.topic('message:activity').publish(activity);
};

function publishMessageEvents(message, targets, user) {
  var timelineTargets = messageSharesToTimelineTarget(targets);
  var activity = require('../core/activitystreams/helpers').userMessageToTimelineEntry(message, 'post', user, timelineTargets);

  localpubsub.topic('message:stored').publish(message);
  globalpubsub.topic('message:stored').publish(message);
  localpubsub.topic('message:activity').publish(activity);
  globalpubsub.topic('message:activity').publish(activity);
}
module.exports.publishMessageEvents = publishMessageEvents;



