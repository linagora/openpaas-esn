'use strict';

var mongoose = require('mongoose');
var TimelineEntry = mongoose.model('TimelineEntry');
var helpers = require('./helpers');

/**
 * Query the timeline
 *
 * @param {Hash} options
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
    q.sort({published: -1});
    if (options.limit) {
      q.limit(options.limit);
    }

    q.exec(function(err, results) {
      if (err) {
        return cb(err);
      }
      return callback(null, results.map(helpers.timelineToActivity));
    });
  };

  var q = TimelineEntry.find().where('target.objectType').equals(options.target.objectType).where('target._id').equals(options.target._id);

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
