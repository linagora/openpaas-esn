(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('calPathParser', calPathParser);

  function calPathParser() {
    return {
      parseCalendarPath: parseCalendarPath
    };

    function parseCalendarPath(path) {
      // The calendarPath is in this form : /calendars/{{calendarHomeId}}/{{calendarId}}.json
      var pathParts = path.replace(/^\//, '').split('/');

      return {
        calendarHomeId: pathParts.length >= 2 ? pathParts[pathParts.length - 2] : pathParts[0],
        calendarId: (pathParts.length >= 2 ? pathParts[pathParts.length - 1] : '').replace(/\.json$/, '')
      };
    }
  }
})();
