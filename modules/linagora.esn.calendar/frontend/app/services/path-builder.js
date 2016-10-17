(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('calPathBuilder', calPathBuilder);

  calPathBuilder.$inject = [
    'DEFAULT_CALENDAR_ID'
  ];

  function calPathBuilder(DEFAULT_CALENDAR_ID) {
    var service = {
      rootPath: rootPath,
      forCalendarHomeId: forCalendarHomeId,
      forCalendarId: forCalendarId,
      forEventId: forEventId
    };

    return service;

    ////////////

    function rootPath() {
      return '/calendars';
    }

    function forCalendarHomeId(calendarHomeId) {
      return rootPath() + '/' + calendarHomeId + '.json';
    }

    function forCalendarId(calendarHomeId, calendarId) {
      return rootPath() + '/' + calendarHomeId + '/' + calendarId + '.json';
    }

    function forEventId(calendarHomeId, eventId) {
      return (rootPath() + '/' + calendarHomeId + '/' + DEFAULT_CALENDAR_ID).replace(/\/$/, '') + '/' + eventId + '.ics';
    }
  }

})();
