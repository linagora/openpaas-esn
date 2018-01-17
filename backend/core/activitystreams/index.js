'use strict';

var mongoose = require('mongoose');
var TimelineEntry = mongoose.model('TimelineEntry');
var helpers = require('./helpers');
var collaboration = require('../collaboration');
var logger = require('../logger');

function getTimelineEntry(id, callback) {
  if (!id) {
    return callback(new Error('Timeline entry ID is required'));
  }
  return TimelineEntry.findById(id).exec(callback);
}
module.exports.getTimelineEntry = getTimelineEntry;

function getUserStreams(user, options, callback) {
  if (!user) {
    return callback(new Error('User is required'));
  }

  if (typeof options === 'function') {
    callback = options;
    options = null;
  }

  var userId = user._id;
  collaboration.getStreamsForUser(userId, options || {}, function(err, streams) {
    if (err) {
      logger.warn('Problem while getting user streams : ' + err.message);
    }
    if (!err && streams) {
      return callback(null, streams);
    }
    return callback(null, []);
  });
}
module.exports.getUserStreams = getUserStreams;

/**
 * Query the timeline
 *
 * @param {Object} options
 * @param {Function} cb
 */
function query(options, cb) {

  if (!options) {
    return cb(new Error('Options is mandatory'));
  }

  if (!options.target) {
    return cb(new Error('Timeline target is mandatory'));
  }

  var getEntries = function(q, callback) {
    if (options.stream) {
      return callback(null, q.cursor());
    }

    q.exec(function(err, results) {
      if (err) {
        return callback(err);
      }
      return callback(null, results.map(helpers.timelineToActivity));
    });
  };

  var q = TimelineEntry.find().where('target.objectType').equals(options.target.objectType).where('target._id').equals(options.target._id);
  if (options.limit) {
    q.limit(+options.limit);
  }

  if (options.after) {
    TimelineEntry.findOne({_id: options.after}).exec(function(err, after) {
      if (err) {
        return cb(err);
      }
      q.sort({published: 1});

      if (!after) {
        return getEntries(q, cb);
      }
      q.where({published: {$gt: after.published}});
      return getEntries(q, cb);
    });
    return;
  } else {
    q.sort({published: -1});
  }

  if (options.before) {
    TimelineEntry.findOne({_id: options.before}).exec(function(err, before) {
      if (err) {
        return cb(err);
      }

      if (!before) {
        return getEntries(q, cb);
      }

      q.where({published: {$lt: before.published}});
      return getEntries(q, cb);
    });
  } else {
    return getEntries(q, cb);
  }
}
module.exports.query = query;

function getTimelineEntries(options, callback) {
  options = options || {};

  function getQuery() {
    var query = {};
    if (options.verb) {
      query.verb = options.verb;
    }

    var q = TimelineEntry.find(query);
    var or = [];

    if (options.actor) {
      or.push({'actor._id': options.actor._id, 'actor.objectType': options.actor.objectType});
    }

    if (options.target) {
      or.push({'target._id': options.target._id, 'target.objectType': options.target.objectType});
    }

    if (options.object) {
      or.push({'object._id': options.object._id, 'object.objectType': options.object.objectType});
    }

    q = q.or(or);

    if (options.excludeVerbs) {
      var and = options.excludeVerbs.map(function(verb) {
        return { verb: { $ne: verb } };
      });

      q = q.where('verb').and(and);
    }

    return q;
  }

  getQuery().count().exec(function(err, count) {
    if (err) {
      return callback(err);
    }

    var timelineQuery = getQuery();

    if (options.offset > 0) {
      timelineQuery = timelineQuery.skip(+options.offset);
    }

    if (options.limit > 0) {
      timelineQuery = timelineQuery.limit(+options.limit);
    }

    timelineQuery.sort('-published').exec(function(err, results) {
      if (err) {
        return callback(err);
      }
      return callback(null, {total_count: count, list: results});
    });
  });
}
module.exports.getTimelineEntries = getTimelineEntries;

/**
 * Add an timeline entry
 *
 * @param {Hash} entry - The event to add to the timeline
 * @param {Function} cb - as cb(err, saved) where saved is the object saved in the storage layer
 */
function addTimelineEntry(entry, cb) {
  if (!entry) {
    return cb(new Error('Timeline entry payload is mandatory'));
  }

  var timelineEntry = new TimelineEntry(entry);
  return timelineEntry.save(cb);
}
module.exports.addTimelineEntry = addTimelineEntry;

function getTimelineEntryFromStreamMessage(activitystream, message, callback) {
  if (!activitystream) {
    return callback(new Error('Activitystream is required'));
  }

  if (!message) {
    return callback(new Error('Message is required'));
  }

  var query = {
    target: {
      objectType: 'activitystream',
      _id: activitystream.uuid
    },
    object: {
      objectType: message.objectType,
      _id: message._id
    }
  };
  return TimelineEntry.findOne(query, callback);
}
module.exports.getTimelineEntryFromStreamMessage = getTimelineEntryFromStreamMessage;

module.exports.permission = require('./permission');

module.exports.tracker = require('./tracker');

module.exports.helpers = helpers;
