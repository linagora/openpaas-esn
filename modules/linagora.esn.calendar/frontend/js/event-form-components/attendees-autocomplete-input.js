'use strict';

angular.module('esn.calendar')
  .directive('attendeesAutocompleteInput', function($q, session, calendarAttendeeService, emailService, naturalService, AUTOCOMPLETE_MAX_RESULTS) {
    function link(scope) {
      scope.onAddingAttendee = function(att) {
        // Attendees are added via tags-input, which uses displayName as the
        // property for both display and newly created tags. We need to adapt
        // the tag for this case.
        var email = att.email || (att.emails && att.emails[0]);
        if (att.displayName && !email && !att.vcard) {
          att.email = email = att.displayName;
        }

        if (email) {
          // Need to check again if it's a duplicate, since ng-tags-input does
          // this a bit early for our taste.
          // We also need to check duplicate with the current invited attendees
          var existingAttendees = scope.mutableAttendees.concat(scope.originalAttendees || []);
          var noduplicate = existingAttendees.every(function(existingAtt) {
            return existingAtt.email !== email;
          });
          // As a nice side-effect, allows us to check for a valid email
          return noduplicate && emailService.isValidEmail(email);
        }
        return true;
      };

      scope.getInvitableAttendees = function(query) {
        scope.query = query;

        var addedAttendees = Object.create(null);
        var existingAttendees = scope.mutableAttendees.concat(scope.originalAttendees || []);
        existingAttendees.forEach(function(att) {
          if (att.email) {
            addedAttendees[att.email] = att;
          }
          if (att.emails) {
            att.emails.forEach(function(email) {
              addedAttendees[email] = att;
            });
          }
        });
        return calendarAttendeeService.getAttendeeCandidates(query, AUTOCOMPLETE_MAX_RESULTS * 2).then(function(attendeeCandidates) {
          attendeeCandidates = attendeeCandidates.filter(function(attendeeCandidate) {
            return !(attendeeCandidate.email in addedAttendees) && !(attendeeCandidate.email in session.user.emailMap);
          });
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
      templateUrl: '/calendar/views/event-form-components/attendees-autocomplete-input.html',
      link: link,
      scope: {
        originalAttendees: '=',
        mutableAttendees: '='
      }
    };
  });
