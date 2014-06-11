'use strict';

var mongoose = require('mongoose');
var Conference = mongoose.model('Conference');
var pubsub = require('../pubsub').local;
var logger = require('../logger');

module.exports.create = function(user, callback) {
  if (!user) {
    return callback(new Error('Creator can not be null'));
  }

  var user_id = user._id || user;
  var conf = new Conference({creator: user_id, attendees: [{user: user_id, status: 'creator'}], history: [{user: user_id, status: 'creation'}]});
  return conf.save(callback);
};

function addHistory(conference, user, status, callback) {
  if (!user) {
    return callback(new Error('Undefined user'));
  }

  if (!conference) {
    return callback(new Error('Undefined conference'));
  }

  if (!status) {
    return callback(new Error('Undefined status'));
  }

  var id = user._id || user;
  var conference_id = conference._id || conference;

  Conference.update({_id: conference_id}, {$push: {history: {user: id, status: status}}}, {upsert: true}, callback);
}
module.exports.addHistory = addHistory;

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

  attendees.forEach(function(element) {
    conference.attendees.push({
      user: element._id || element,
      status: 'invited'
    });
  });

  var topic = pubsub.topic('conference:invited');

  conference.save(function(err, updated) {
    if (err) {
      return callback(err);
    }

    updated.attendees.forEach(function(attendee) {
      var invitation = {
        conference_id: updated._id,
        user_id: attendee.user,
        creator_id: updated.creator
      };
      topic.publish(invitation);
    });
    return callback(null, updated);
  });
};

module.exports.get = function(id, callback) {
  Conference.findById(id).exec(callback);
};

module.exports.loadWithAttendees = function(id, callback) {
  Conference.findById(id).sort('-timestamps.creation').populate('attendees.user', null, 'User').exec(callback);
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

  var id = user._id || user;
  return callback(null, conference.creator.equals(id));
};

module.exports.userIsConferenceAttendee = function(conference, user, callback) {
  if (!user) {
    return callback(new Error('Undefined user'));
  }

  if (!conference) {
    return callback(new Error('Undefined conference'));
  }

  var id = user._id || user;
  var conference_id = conference._id || conference;

  Conference.findOne({_id: conference_id}, {attendees: {$elemMatch: {user: id}}}).exec(function(err, conf) {
    if (err) {
      return callback(err);
    }
    return callback(null, (conf.attendees !== null && conf.attendees.length > 0));
  });
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
  var conference_id = conference._id || conference;

  Conference.update({_id: conference_id, attendees: {$elemMatch: {user: id}}}, {$set: {'attendees.$': {user: id, status: 'online'}}}, {upsert: true}, function(err, updated) {
    if (err) {
      return callback(err);
    }
    var topic = pubsub.topic('conference:join');
    topic.publish({
      conference_id: conference_id,
      user_id: id
    });

    addHistory(conference_id, id, 'join', function(err, history) {
      if (err) {
        logger.warn('Error while pushing new history element ' + err.message);
      }
      return callback(null, updated);
    });
  });
};

module.exports.leave = function(conference, user, callback) {
  if (!user) {
    return callback(new Error('Undefined user'));
  }

  if (!conference) {
    return callback(new Error('Undefined conference'));
  }

  var id = user._id || user;
  var conference_id = conference._id || conference;

  Conference.update({_id: conference_id, attendees: {$elemMatch: {user: id}}}, {$set: {'attendees.$': {user: id, status: 'offline'}}}, {upsert: true}, function(err, updated) {
    if (err) {
      return callback(err);
    }
    var topic = pubsub.topic('conference:leave');
    topic.publish({
      conference_id: conference_id,
      user_id: id
    });

    addHistory(conference_id, id, 'leave', function(err, history) {
      if (err) {
        logger.warn('Error while pushing new history element ' + err.message);
      }
      return callback(null, updated);
    });
  });
};
