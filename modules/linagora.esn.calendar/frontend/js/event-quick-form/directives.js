'use strict';

angular.module('esn.calendar')
  .directive('eventQuickFormWizard', function(WidgetWizard, $rootScope) {
    function link($scope, element) {
      $scope.wizard = new WidgetWizard([
        '/calendar/views/event-quick-form/event-quick-form-wizard-step-0'
      ]);
    }
    return {
      restrict: 'E',
      templateUrl: '/calendar/views/event-quick-form/event-quick-form-wizard',
      scope: {
        user: '=',
        domain: '=',
        createModal: '=',
        event: '='
      },
      link: link
    };
  })

  .directive('eventCreateButton', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        community: '=',
        user: '='
      },
      templateUrl: '/calendar/views/event-quick-form/event-create-button.html'
    };
  })

  .directive('eventQuickForm', function($location, $timeout, $q, domainAPI, calendarUtils, session, ICAL_PROPERTIES, AUTOCOMPLETE_MAX_RESULTS) {
    function link($scope, element, attrs, controller) {
      controller.initFormData();

      $scope.closeModal = function() {
        $scope.createModal.hide();
      };

      $scope.isNew = controller.isNew;
      $scope.deleteEvent = controller.deleteEvent;
      $scope.submit = $scope.isNew($scope.editedEvent) ? controller.addNewEvent : controller.modifyEvent;
      $scope.changeParticipation = controller.changeParticipation;
      $scope.resetEvent = controller.resetEvent;
      $scope.getMinDate = controller.getMinDate;
      $scope.onStartDateChange = controller.onStartDateChange;
      $scope.onEndDateChange = controller.onEndDateChange;
      $scope.getMinTime = controller.getMinTime;
      $scope.onAddingAttendee = function(att) {
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
        var existingAttendees = $scope.newAttendees.concat($scope.editedEvent.attendees || []);
        var noduplicate = existingAttendees.every(function(existingAtt) {
          return existingAtt.email !== firstEmail;
        });
        // As a nice side-effect, allows us to check for a valid email
        var emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?)*$/;
        return noduplicate && !!emailRegex.exec(firstEmail);
      };
      $scope.selectAttendee = controller.selectAttendee;
      $scope.deleteSelectedAttendees = controller.deleteSelectedAttendees;

      $scope.getInvitableAttendees = function(query) {
        $scope.query = query;

        var memberQuery = { search: query, limit: AUTOCOMPLETE_MAX_RESULTS };
        return domainAPI.getMembers(session.domain._id, memberQuery).then(function(response) {
          var addedAttendees = Object.create(null);
          if ($scope.editedEvent.attendees) {
            $scope.editedEvent.attendees.forEach(function(att) {
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

          $scope.query = '';
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
                partstat: ICAL_PROPERTIES.partstat.needsaction
              }));
            }
            return members;
          }, []));
        });
      };

      $scope.goToFullForm = function() {
        $scope.closeModal();
        $location.path('/calendar/event-full-form');
      };

      $timeout(function() {
        element.find('.title')[0].focus();
      }, 0);

      $scope.focusSubmitButton = function() {
        $timeout(function() {
          element.find('button[type="submit"]').focus();
        });
      };
    }

    return {
      restrict: 'E',
      replace: true,
      controller: 'eventFormController',
      templateUrl: '/calendar/views/event-quick-form/event-quick-form.html',
      link: link
    };
  })

  .directive('attendeeListItem', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-quick-form/attendee-list-item.html',
      controller: 'eventFormController',
      scope: {
        attendee: '=',
        readOnly: '='
      },
      link: function(scope) {
        scope.attendeeType = scope.attendee.name === scope.attendee.email ? 'email' : 'user';
      }
    };
  });
