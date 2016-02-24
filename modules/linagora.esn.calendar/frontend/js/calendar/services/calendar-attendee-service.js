'use strict';

angular.module('esn.calendar').factory('calendarAttendeeService', function(attendeeService, ICAL_PROPERTIES) {
  function getAttendeeCandidates(query, limit) {
    return attendeeService.getAttendeeCandidates(query, limit).then(function(attendeeCandidates) {
      return attendeeCandidates.map(function(attendeeCandidate) {
        attendeeCandidate.partstat = ICAL_PROPERTIES.partstat.needsaction;
        return attendeeCandidate;
      });
    });
  }

  return {
    getAttendeeCandidates: getAttendeeCandidates
  };
});
