(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('calendarAttendeeService', calendarAttendeeService);

  function calendarAttendeeService(attendeeService, CAL_ICAL) {
    var service = {
      getAttendeeCandidates: getAttendeeCandidates
    };

    return service;

    ////////////

    function getAttendeeCandidates(query, limit) {
      return attendeeService.getAttendeeCandidates(query, limit).then(function(attendeeCandidates) {
        return attendeeCandidates.map(function(attendeeCandidate) {
          attendeeCandidate.partstat = CAL_ICAL.partstat.needsaction;

          return attendeeCandidate;
        });
      });
    }
  }

})();
