'use strict';

angular.module('esn.calendar')
  .directive('attendeesAutocompleteInput', function($q, domainAPI, calendarUtils, session, AUTOCOMPLETE_MAX_RESULTS) {
    function link(scope) {
      scope.onAddingAttendee = function(att) {
        // Attendees are added via tags-input, which uses displayName as the
        // property for both display and newly created tags. We need to adapt
        // the tag for this case.
        var firstEmail = att.email || (att.emails && att.emails[0]);
        if (att.displayName && !firstEmail) {
          att.email = firstEmail = att.displayName;
        }

        // Need to check again if it's a duplicate, since ng-tags-input does
        // this a bit early for our taste.
        // We also need to check duplicate with the current invited attendees
        var existingAttendees = scope.mutableAttendees.concat(scope.originalAttendees || []);
        var noduplicate = existingAttendees.every(function(existingAtt) {
          return existingAtt.email !== firstEmail;
        });
        // As a nice side-effect, allows us to check for a valid email
        var emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?)*$/;
        return noduplicate && !!emailRegex.exec(firstEmail);
      };

      scope.getInvitableAttendees = function(query) {
        scope.query = query;

        var memberQuery = { search: query, limit: AUTOCOMPLETE_MAX_RESULTS };
        return domainAPI.getMembers(session.domain._id, memberQuery).then(function(response) {
          var addedAttendees = Object.create(null);
          if (scope.originalAttendees) {
            scope.originalAttendees.forEach(function(att) {
              if (att.email) {
                addedAttendees[att.email] = att;
              }
              if (att.emails) {
                att.emails.forEach(function(email) {
                  addedAttendees[email] = att;
                });
              }
            });
          }

          scope.query = '';
          return $q.when(response.data.reduce(function(members, user) {
            var alreadyAdded = user.emails.some(function(email) {
              return (email in addedAttendees) || (email in session.user.emailMap);
            });

            if (!alreadyAdded) {
              var firstEmail = user.emails[0];
              members.push(angular.extend(user, {
                id: user._id,
                email: firstEmail,
                emails: user.emails,
                displayName: (user.firstname && user.lastname) ?
                  calendarUtils.displayNameOf(user.firstname, user.lastname) :
                  firstEmail,
                partstat: 'NEEDS-ACTION'
              }));
            }
            return members;
          }, []));
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
