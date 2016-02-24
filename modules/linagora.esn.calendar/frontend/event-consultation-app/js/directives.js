'use strict';

angular.module('esn.calendar.event-consultation')
  .directive('eventConsultFormExternalUser', function($http, CalendarShell, ICAL_PROPERTIES, CALENDAR_EVENTS) {
    function link(scope) {
      var eventJCal = JSON.parse(scope.eventJSON.replace(/&quot;/g, '"'));

      scope.event = CalendarShell.from(eventJCal);
      scope.event.attendees.forEach(function(attendee) {
        if (attendee.email === scope.attendeeEmail) {
          scope.invitedAttendee = attendee;
        }
      });

      var urls = {};
      urls[ICAL_PROPERTIES.partstat.accepted] = scope.yesLink;
      urls[ICAL_PROPERTIES.partstat.declined] = scope.noLink;
      urls[ICAL_PROPERTIES.partstat.tentative] = scope.maybeLink;

      scope.modifyEventParticipation = function(partstat) {
        scope.invitedAttendee.partstat = partstat;
        scope.$broadcast(CALENDAR_EVENTS.EVENT_ATTENDEES_UPDATE, scope.event.attendees);
        $http({
          method: 'GET',
          url: urls[partstat]
        });
      };
    }

    return {
      restrict: 'E',
      replace: true,
      controller: 'eventController',
      template: '<div><event-consult-form-body/></div>',
      link: link
    };
  });
