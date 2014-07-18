'use strict';

var mongoose = require('mongoose');

/**
 * {
 *   _id: UID (the mongodb id of the user),
 *   timelines: {
 *     ASID (mongodb id of the activity stream) : ID (mongodb id of the last timelineentry seen by the user)
 *   }
 * }
 */
var TimelineEntriesTrackerSchema = new mongoose.Schema({
  timelines: {type: Object}
});

module.exports = mongoose.model('TimelineEntriesTracker', TimelineEntriesTrackerSchema);
