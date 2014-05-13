'use strict';

var getURN = function(type, id) {
  return 'urn:linagora.com:' + type + ':' + id;
};
module.exports.getURN = getURN;

module.exports.userMessageToTimelineEntry = function(message, verb, user, shares, date) {
  return {
    verb: verb,
    language: message.language,
    published: date || Date.now,
    actor: {
      objectType: 'user',
      _id: user._id,
      image: user.currentAvatar || '',
      displayName: user.firstname + ' ' + user.lastname
    },
    object: {
      objectType: message.objectType,
      _id: message._id
    },
    target: shares
  };
};

module.exports.timelineToActivity = function(entry) {
  return {
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
};


