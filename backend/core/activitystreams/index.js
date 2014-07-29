'use strict';

var mongoose = require('mongoose');
var TimelineEntry = mongoose.model('TimelineEntry');
var helpers = require('./helpers');
var domain = require('../user/domain');
var community = require('../community');

function getUserStreams(user, callback) {
  if (!user) {
    return callback(new Error('User is required'));
  }

  var result = [];

  var id = user._id || user;
  domain.getUserDomains(id, function(err, domains) {
    if (!err && domains && domains.length > 0) {
      domains.forEach(function(d) {
        var stream = {
          uuid: d.activity_stream.uuid,
          target: {
            objectType: 'domain',
            displayName: d.name,
            _id: d._id,
            id: 'urn:linagora.com:domain:' + d._id,
            image: ''
          }
        };
        result.push(stream);
      });
    }

    community.getUserCommunities(id, function(err, communities) {
      if (!err && communities && communities.length) {
        communities.forEach(function(c) {
          var stream = {
            uuid: c.activity_stream.uuid,
            target: {
              objectType: 'community',
              displayName: c.title,
              _id: c._id,
              id: 'urn:linagora.com:community:' + c._id,
              image: c.avatar || ''
            }
          };
          result.push(stream);
        });
      }
      return callback(null, result);
    });
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
