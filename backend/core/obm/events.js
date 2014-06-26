'use strict';

var commons = require('./index');

var routes = {
  events: '/calendar/getSyncWithSortedChanges',
  state: '/calendar/changeParticipationState'
};

function getEvents(user, callback) {
  if (!user) {
    return callback(new Error('User is required'));
  }

  commons.getSessionId(user, function(err, sid) {
    if (err) {
      return callback(err);
    }

    if (!sid) {
      return callback(new Error('Can not get session ID for user', user));
    }

    var form = {
      sid: sid,
      calendar: user.emails[0]
    };

    commons.post(user, routes.events, form, function(err, events) {
      if (err) {
        return callback(err);
      }

      var result = [];

      if (events['calendar-changes']) {
        var updated = events['calendar-changes'].updated;
        if (updated.length === 1 && updated[0].event) {
          updated[0].event.forEach(function(e) {
            var event = e['$']; // jshint ignore:line
            event.timeupdate = e.timeupdate[0];
            event.timecreate = e.timecreate[0];
            event.extId = e.extId[0];
            event.opacity = e.opacity[0];
            event.title = e.title[0];
            event.owner = e.owner[0];
            event.ownerEmail = e.ownerEmail[0];
            event.tz = e.tz[0];
            event.date = e.date[0];
            event.priority = e.priority[0];
            event.privacy = e.privacy[0];
            event.attendees = e.attendees[0].attendee.map(function(attendee) {
              return attendee['$']; // jshint ignore:line
            });
            event.recurrence = e.recurrence[0]['$']; // jshint ignore:line
            result.push(event);
          });
        }
      }
      return callback(null, {updated: result});
    });
  });
}
module.exports.getEvents = getEvents;

function setEventState(user, event, state, callback) {
  if (!user || !event || !state) {
    return callback(new Error('Bad parameters'));
  }

  var event_id = event.extId || event;
  var sequence = event.sequence || 0;

  commons.getSessionId(user, function(err, sid) {
    if (err) {
      return callback(err);
    }

    if (!sid) {
      return callback(new Error('Can not get session ID for user', user));
    }

    var form = {
      sid: sid,
      calendar: user.emails[0],
      extId: event_id,
      state: state,
      sequence: sequence
    };
    commons.post(user, routes.state, form, callback);
  });
}
module.exports.setEventState = setEventState;
