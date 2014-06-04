'use strict';

var mongoose = require('mongoose');
var Conference = mongoose.model('Conference');
var pubsub = require('../pubsub').local;

module.exports.create = function(user, callback) {
  if (!user) {
    return callback(new Error('Creator can not be null'));
  }

  var user_id = user._id || user;
  var conf = new Conference({creator: user_id});
  return conf.save(callback);
};

module.exports.invite = function(conference, attendees, callback) {
  if (!conference) {
    return callback(new Error('Can not invite to an undefined conference'));
  }

  if (!attendees) {
    return callback(new Error('Can not invite undefined attendees'));
  }

  if (!Array.isArray(attendees)) {
    attendees = [attendees];
  }

  conference.attendees = attendees.map(function(e) {
    return {
      user: e._id || e,
      timestamps: [{
        step: 'invited',
        date: Date.now()
      }]
    };
  });

  var topic = pubsub.topic('conference:invited');

  conference.save(function(err, updated) {
    if (err) {
      return callback(err);
    }

    updated.attendees.forEach(function(attendee) {
      var invitation = {
        conference: updated._id,
        user: attendee.user,
        creator: updated.creator
      };
      topic.publish(invitation);
    });
    return callback(null, updated);
  });
};

module.exports.get = function(id, callback) {
  Conference.findById(id).exec(callback);
};

module.exports.updateAttendeeStatus = function(conference, attendee, status, callback) {
  return callback(new Error());
};

module.exports.list = function(callback) {
  Conference.find().sort('-timestamps.creation').populate('creator', null, 'User').exec(callback);
};

module.exports.userIsConferenceCreator = function(conference, user, callback) {
  if (!user) {
    return callback(new Error('Undefined user'));
  }

  if (!conference) {
    return callback(new Error('Undefined conference'));
  }

  var id = user._id ||  user;
  return callback(null, conference.creator === id);
};

module.exports.userIsConferenceAttendee = function(conference, user, callback) {
  if (!user) {
    return callback(new Error('Undefined user'));
  }

  if (!conference) {
    return callback(new Error('Undefined conference'));
  }

  var id = user._id ||  user;

  var found = conference.attendees.some(function(element) {
    return element.user === id;
  });
  return callback(null, found);
};

module.exports.userCanJoinConference = function(conference, user, callback) {
  if (!user) {
    return callback(new Error('Undefined user'));
  }

  if (!conference) {
    return callback(new Error('Undefined conference'));
  }

  var self = this;
  this.userIsConferenceCreator(conference, user, function(err, status) {
    if (err) {
      return callback(err);
    }

    if (status) {
      return callback(null, true);
    }

    return self.userIsConferenceAttendee(conference, user, callback);
  });
};

module.exports.join = function(conference, user, callback) {
  if (!user) {
    return callback(new Error('Undefined user'));
  }

  if (!conference) {
    return callback(new Error('Undefined conference'));
  }

  var id = user._id || user;
  conference.attendees.push({user: id, timestamps: [{step: 'joined', date: Date.now()}]});

  conference.save(function(err, updated) {
    if (err) {
      return callback(err);
    }
    var topic = pubsub.topic('conference:joined');
    topic.publish({
      conference: updated._id,
      user: id
    });

    return callback(null, updated);
  });
};

module.exports.leave = function(conference, user, callback) {
  return callback(new Error('Not implemented'));
};

