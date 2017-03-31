(function() {
  'use strict';

  angular.module('esn.calendar')
         .service('calPublicCalendarStore', calPublicCalendarStore);

  function calPublicCalendarStore($rootScope, _, CAL_EVENTS) {
    var publicCalendars = {};

    this.storeAll = storeAll;
    this.getAll = getAll;

    ///////////

    function storeAll(calendars) {
      calendars.forEach(function(calendar) {
        publicCalendars[calendar.id] = calendar;

        $rootScope.$broadcast(CAL_EVENTS.CALENDARS.ADD, calendar);
      });
    }

    function getAll() {
      return _.values(publicCalendars);
    }
  }

})();
