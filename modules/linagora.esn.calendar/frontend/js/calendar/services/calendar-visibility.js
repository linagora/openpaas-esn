'use strict';

angular.module('esn.calendar')
  .factory('calendarVisibilityService', function($rootScope, CALENDAR_EVENTS, _) {
    var cache = {};

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

    return {
      isHidden: isHidden,
      getHiddenCalendars: getHiddenCalendars,
      toggle: toggle
    };
  });
