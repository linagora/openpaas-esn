(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('calendarAttendeeService', calendarAttendeeService);

  calendarAttendeeService.$inject = [
    'attendeeService',
    'ICAL_PROPERTIES'
  ];

  function calendarAttendeeService(attendeeService, ICAL_PROPERTIES) {
    var service = {
      getAttendeeCandidates: getAttendeeCandidates
    };

    return service;

    ////////////

    function getAttendeeCandidates(query, limit) {
      return attendeeService.getAttendeeCandidates(query, limit).then(function(attendeeCandidates) {
        return attendeeCandidates.map(function(attendeeCandidate) {
          attendeeCandidate.partstat = ICAL_PROPERTIES.partstat.needsaction;

          return attendeeCandidate;
        });
      });
    }
  }

})();
