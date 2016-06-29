'use strict';

angular.module('esn.calendar')

  .directive('attendeesAutocompleteInput', function(session, calendarAttendeeService, emailService, naturalService, AUTOCOMPLETE_MAX_RESULTS) {
    function link(scope) {
      function getAddedAttendeeIds() {
        var addedAttendees = scope.mutableAttendees.concat(scope.originalAttendees || []);
        var addedAttendeeIds = [];
        addedAttendees.forEach(function(att) {
          addedAttendeeIds.push(att.id);
        });
        return addedAttendeeIds;
      }

      function isDuplicateAttendee(att, addedAttendeeIds) {
        return (att.email in session.user.emailMap) ||
               addedAttendeeIds.indexOf(att.id) > -1;
      }

      function fillNonDuplicateAttendees(attendees) {
        var addedAttendeeIds = getAddedAttendeeIds();

        return attendees.filter(function(att) {
          return !isDuplicateAttendee(att, addedAttendeeIds);
        });
      }

      scope.mutableAttendees = scope.mutableAttendees || [];
      scope.onAddingAttendee = function(att) {
        if (!att.id) {
          att.id = att.displayName;
          att.email = att.displayName;
        }
        return !isDuplicateAttendee(att, getAddedAttendeeIds()) &&
               emailService.isValidEmail(att.email);
      };

      scope.getInvitableAttendees = function(query) {
        scope.query = query;

        return calendarAttendeeService.getAttendeeCandidates(query, AUTOCOMPLETE_MAX_RESULTS * 2).then(function(attendeeCandidates) {
          attendeeCandidates = fillNonDuplicateAttendees(attendeeCandidates);
          attendeeCandidates.sort(function(a, b) {
            return naturalService.naturalSort(a.displayName, b.displayName);
          });
          return attendeeCandidates.slice(0, AUTOCOMPLETE_MAX_RESULTS);
        });
      };
    }

    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/components/attendees-autocomplete-input.html',
      link: link,
      scope: {
        originalAttendees: '=',
        mutableAttendees: '='
      }
    };
  });
