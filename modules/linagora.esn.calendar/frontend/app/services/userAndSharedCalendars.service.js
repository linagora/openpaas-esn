(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('userAndSharedCalendars', userAndSharedCalendars);

  function userAndSharedCalendars(session, CALENDAR_RIGHT, _) {
    return function(calendars) {
      var userCalendars, sharedCalendars;

      userCalendars = calendars.filter(function(calendar) {
        if (calendar.rights) {
          var rights = calendar.rights.getUserRight(session.user._id);

          return rights === CALENDAR_RIGHT.ADMIN;
        }

        return true;
      });

      sharedCalendars = calendars.filter(function(calendar) {
        if (!_.contains(self.userCalendars, calendar) && calendar.rights) {
          var delegationRight = calendar.rights.getUserRight(session.user._id);
          var publicRight = calendar.rights.getPublicRight();

          return delegationRight !== CALENDAR_RIGHT.ADMIN || publicRight === CALENDAR_RIGHT.PUBLIC_READ;
        }

        return false;
      });

      return {
        userCalendars: userCalendars,
        sharedCalendars: sharedCalendars
      };
    };
  }
})();
