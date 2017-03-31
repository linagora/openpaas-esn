(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('calendarHomeService', calendarHomeService);

  function calendarHomeService(session) {
    var service = {
      getUserCalendarHomeId: getUserCalendarHomeId
    };

    return service;

    ////////////

    function getUserCalendarHomeId() {
      return session.ready.then(function(session) {
        return session.user._id;
      });
    }
  }

})();
