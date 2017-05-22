(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('CalCalendarRightsUtilsService', CalCalendarRightsUtilsService);

  function CalCalendarRightsUtilsService(CAL_CALENDAR_PUBLIC_RIGHT_HUMAN_READABLE) {
    return {
      asHumanReadable: asHumanReadable
    };

    function asHumanReadable(right) {
      return angular.isString(right) ? CAL_CALENDAR_PUBLIC_RIGHT_HUMAN_READABLE[right] || CAL_CALENDAR_PUBLIC_RIGHT_HUMAN_READABLE.unknown : CAL_CALENDAR_PUBLIC_RIGHT_HUMAN_READABLE.unknown;
    }
  }
})();
