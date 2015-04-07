'use strict';

// Tracks the last timelineentries 'pushed' to the user.
// For example, this can be used to store the linked messages which has been sent as an email.
// By keeping these references, the processes are able to not resend the same messages twice.

var mongoose = require('mongoose');
var baseSchema = require('./base-timelineentriestracker');

var PushSpecificSchema = new mongoose.Schema(baseSchema, { collection: 'pushtimelineentriestrackers' });
module.exports = mongoose.model('PushTimeLineEntriesTracker', PushSpecificSchema);
