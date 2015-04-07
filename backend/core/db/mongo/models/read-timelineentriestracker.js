'use strict';

// Tracks the last timelineentries read by the user.

var mongoose = require('mongoose');
var baseSchema = require('./base-timelineentriestracker');

var ReadlineEntriesTrackerSchema = new mongoose.Schema(baseSchema, { collection: 'readtimelineentriestrackers' });
module.exports = mongoose.model('ReadTimeLineEntriesTracker', ReadlineEntriesTrackerSchema);
