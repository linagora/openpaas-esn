'use strict';

angular.module('esn.calendar').factory('calendarHomeService', function(session) {
  function getUserCalendarHomeId() {
    return session.ready.then(function(session) {
      return session.user._id;
    });
  }

  return {
    getUserCalendarHomeId: getUserCalendarHomeId
  };
});
