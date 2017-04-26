(function() {
  'use strict';

  angular.module('esn.calendar')
    .service('calPublicCalendarStore', calPublicCalendarStore);

  function calPublicCalendarStore($rootScope, _, CAL_EVENTS) {
    var publicCalendars = {};

    this.getAll = getAll;
    this.getById = getById;
    this.storeAll = storeAll;

    ///////////

    function getAll() {
      return _.values(publicCalendars);
    }

    function getById(calendarId) {
      return publicCalendars[calendarId];
    }

    function storeAll(calendars) {
      calendars.forEach(function(calendar) {
        publicCalendars[calendar.id] = calendar;

        $rootScope.$broadcast(CAL_EVENTS.CALENDARS.ADD, calendar);
      });
    }
  }
})();
