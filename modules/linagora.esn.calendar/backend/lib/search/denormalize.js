'use strict';

var jcal = require('../helpers/jcal');
var moment = require('moment');
var _ = require('lodash');

function denormalize(data) {
  var event = jcal.jcal2content(data.ics, '');
  var timeInfo = jcal.getIcalEvent(data.ics);

  var start = moment(timeInfo.startDate.toJSDate());
  var end = moment(timeInfo.endDate.toJSDate());

  if (event.allDay) {
    start.add(start.utcOffset(), 'minutes');
    end.add(end.utcOffset(), 'minutes');
  }
  event.start = start.toJSON();
  event.end = end.toJSON();
  event.userId = data.userId;
  event.calendarId = data.calendarId;

  if (event.organizer) {
    delete event.organizer.avatar;
  }

  delete event.alarm;
  delete event.method;
  delete event.sequence;

  event.attendees = _.map(event.attendees, function(data, email) {
    return {email: email, cn: data.cn};
  });

  return event;
}

function getId(event) {
  return event.eventUid;
}

module.exports.getId = getId;

module.exports.denormalize = denormalize;
