'use strict';

const jcal = require('../helpers/jcal');
const moment = require('moment');
const _ = require('lodash');

module.exports = {
  denormalize,
  getId
};

function denormalize(data) {
  const event = jcal.jcal2content(data.ics, '');
  const timeInfo = jcal.getIcalEvent(data.ics);
  const start = moment(timeInfo.startDate.toJSDate());
  const end = moment(timeInfo.endDate.toJSDate());
  const dtstamp = moment(timeInfo.component.getFirstPropertyValue('dtstamp').toJSDate());

  if (event.allDay) {
    start.add(start.utcOffset(), 'minutes');
    end.add(end.utcOffset(), 'minutes');
  }
  event.start = start.toJSON();
  event.end = end.toJSON();
  event.dtstamp = dtstamp.toJSON();
  event.userId = data.userId;
  event.calendarId = data.calendarId;

  if (event.organizer) {
    delete event.organizer.avatar;
  }

  delete event.alarm;
  delete event.method;
  delete event.sequence;

  event.attendees = _.map(event.attendees, (data, email) => ({email: email, cn: data.cn}));

  return event;
}

function getId(event) {
  return event.eventUid;
}
