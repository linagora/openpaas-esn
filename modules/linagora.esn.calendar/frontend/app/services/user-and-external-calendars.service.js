(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('userAndExternalCalendars', userAndExternalCalendars);

  function userAndExternalCalendars(session) {
    return function(calendars) {
      var userCalendars, sharedCalendars, publicCalendars;

      userCalendars = calendars.filter(function(calendar) {
        return calendar.isOwner(session.user._id);
      });

      sharedCalendars = calendars.filter(function(calendar) {
        return !calendar.isOwner(session.user._id) && calendar.isShared(session.user._id);
      });

      publicCalendars = calendars.filter(function(calendar) {
        return !calendar.isOwner(session.user._id) && !calendar.isShared(session.user._id) && calendar.isPublic();
      });

      return {
        userCalendars: userCalendars,
        sharedCalendars: sharedCalendars,
        publicCalendars: publicCalendars
      };
    };
  }
})();
