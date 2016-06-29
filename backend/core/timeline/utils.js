'use strict';

var mongoose = require('mongoose');
var TimelineEntry = mongoose.model('TimelineEntry');

function asObject(timelineentry) {
  var options = {virtuals: true};
  return timelineentry instanceof TimelineEntry ? timelineentry.toObject(options) : new TimelineEntry(timelineentry).toObject(options);
}
module.exports.asObject = asObject;
