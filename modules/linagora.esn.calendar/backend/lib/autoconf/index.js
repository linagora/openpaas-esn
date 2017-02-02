'use strict';

module.exports = dependencies => {
  const client = require('../caldav-client')(dependencies);

  return {
    transform: (config, user) => client.getCalendarList(user.id).then(calendars => {
      config.calendars = calendars.map(calendar => {
        calendar.username = user.preferredEmail;

        return calendar;
      });
    })
  };
};
