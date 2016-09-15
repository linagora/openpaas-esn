(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('calendarVisibilityService', calendarVisibilityService);

  calendarVisibilityService.$inject = [
    '$rootScope',
    '_',
    'CALENDAR_EVENTS'
  ];

  function calendarVisibilityService($rootScope, _, CALENDAR_EVENTS) {
    var cache = {};

    var service = {
      getHiddenCalendars: getHiddenCalendars,
      isHidden: isHidden,
      toggle: toggle
    };

    return service;

    ////////////

    function isHidden(calendar) {
      return Boolean(cache[calendar.id] && cache[calendar.id].hidden);
    }

    function toggle(calendar) {
      var hidden = !cache[calendar.id] || !cache[calendar.id].hidden;

      cache[calendar.id] = {
        calendar: calendar,
        hidden: hidden
      };

      $rootScope.$broadcast(CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, cache[calendar.id]);
    }

    function getHiddenCalendars() {
      return _.chain(cache).filter('hidden').map('calendar').value();
    }
  }

})();
