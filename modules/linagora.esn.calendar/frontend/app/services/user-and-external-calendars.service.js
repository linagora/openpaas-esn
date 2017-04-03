(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('userAndExternalCalendars', userAndExternalCalendars);

  function userAndExternalCalendars(session) {
    return function(calendars) {
      var userCalendars, sharedCalendars, publicCalendars;

      userCalendars = calendars.filter(function(calendar) {
        if (calendar.rights) {
          return calendar.isOwner(session.user._id);
        }

        return true;
      });

      sharedCalendars = calendars.filter(function(calendar) {
        if (calendar.rights) {
          return !calendar.isOwner(session.user._id) && calendar.isShared(session.user._id);
        }

        return false;
      });

      publicCalendars = calendars.filter(function(calendar) {
        if (calendar.rights) {
          return !calendar.isOwner(session.user._id) && !calendar.isShared(session.user._id) && calendar.isPublic();
        }

        return false;
      });

      return {
        userCalendars: userCalendars,
        sharedCalendars: sharedCalendars,
        publicCalendars: publicCalendars
      };
    };
  }
})();
