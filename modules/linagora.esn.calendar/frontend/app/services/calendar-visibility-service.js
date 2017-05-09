(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('calendarVisibilityService', calendarVisibilityService);

  function calendarVisibilityService($rootScope, _, CAL_EVENTS, localStorageService) {
    var storage = localStorageService.getOrCreateInstance('calendarStorage');

    return {
      getHiddenCalendars: getHiddenCalendars,
      isHidden: isHidden,
      toggle: toggle
    };

    ////////////

    function isHidden(calendar) {
      return storage.getItem(calendar.uniqueId).then(function(value) {
        return Boolean(value);
      });
    }

    function toggle(calendar) {
      storage.getItem(calendar.uniqueId).then(function(hiddenBefore) {
        return storage.setItem(calendar.uniqueId, !hiddenBefore);
      }).then(function(hidden) {
        $rootScope.$broadcast(CAL_EVENTS.CALENDARS.TOGGLE_VIEW, {
          calendarUniqueId: calendar.uniqueId,
          hidden: hidden
        });

        return hidden;
      });
    }

    function getHiddenCalendars() {
      var result = [];
      return storage.iterate(function(hidden, id) {
        if (hidden) {
          result.push(id);
        }
      }).then(function() {
        return result;
      });

    }
  }
})();
