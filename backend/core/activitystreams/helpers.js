'use strict';

var getURN = function(type, id) {
  return 'urn:linagora.com:' + type + ':' + id;
};
module.exports.getURN = getURN;

var getUserAsActor = function(user) {
  if (!user) {
    return {};
  }

  return {
    objectType: 'user',
    _id: user._id,
    image: user.currentAvatar || '',
    displayName: user.firstname + ' ' + user.lastname
  };
};
module.exports.getUserAsActor = getUserAsActor;

module.exports.userMessageToTimelineEntry = function(message, verb, user, shares, date) {
  return {
    verb: verb,
    language: message.language || '',
    published: date || Date.now(),
    actor: getUserAsActor(user),
    object: {
      objectType: message.objectType,
      _id: message._id
    },
    target: shares,
    to: message.recipients || []
  };
};

module.exports.userMessageCommentToTimelineEntry = function(comment, verb, user, shares, inReplyTo, date) {
  var result = this.userMessageToTimelineEntry(comment, verb, user, shares, date);
  result.inReplyTo = [inReplyTo];
  return result;
};

module.exports.timelineToActivity = function(entry) {
  var timelineentry = {
    _id: entry._id,
    verb: entry.verb,
    language: entry.language,
    published: entry.published,
    actor: {
      _id: entry.actor._id,
      objectType: entry.actor.objectType,
      id: getURN(entry.actor.objectType, entry.actor._id),
      image: getURN('avatar', entry.actor.image),
      displayName: entry.actor.displayName
    },
    object: {
      _id: entry.object._id,
      objectType: entry.object.objectType,
      id: getURN(entry.object.objectType, entry.object._id)
    },
    target: entry.target.map(function(t) {
      return {
        _id: t._id,
        objectType: t.objectType,
        id: getURN(t.objectType, t._id)
      };
    })
  };

  if (entry.inReplyTo && entry.inReplyTo.length) {
    timelineentry.inReplyTo = entry.inReplyTo.map(function(elt) {
      return {
        _id: elt._id,
        objectType: elt.objectType,
        id: getURN(elt.objectType, elt._id)
      };
    });
  }

  if (entry.to) {
    timelineentry.to = entry.to;
  }

  return timelineentry;
};


