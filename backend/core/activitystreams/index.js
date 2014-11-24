'use strict';

var mongoose = require('mongoose');
var TimelineEntry = mongoose.model('TimelineEntry');
var helpers = require('./helpers');
var community = require('../community');
var logger = require('../logger');

function communityToStream(community) {
  return {
    uuid: community.activity_stream.uuid,
    target: {
      objectType: 'community',
      _id: community._id,
      displayName: community.title,
      id: 'urn:linagora.com:community:' + community._id,
      image: community.avatar || ''
    }
  };
}

function getUserStreams(user, options, callback) {
  if (!user) {
    return callback(new Error('User is required'));
  }

  var id = user._id || user;
  community.getUserCommunities(id, options || {}, function(err, communities) {

    if (err) {
      logger.warn('Problem while getting user communities : ' + err.message);
    }

    var result = [];
    if (!err && communities && communities.length) {
      communities.forEach(function(community) {
        result.push(communityToStream(community));
      });
    }
    return callback(null, result);
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
      return callback(null, q.stream());
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
    q.limit(options.limit);
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
