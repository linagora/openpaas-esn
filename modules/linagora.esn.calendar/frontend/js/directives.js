'use strict';

angular.module('esn.calendar')
  .directive('eventMessage', function(calendarService, session) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/message/templates/event-message.html',
      link: function($scope, element, attrs) {
        $scope.changeParticipation = function(partstat) {
          var vcalendar = $scope.event.vcalendar;
          var path = $scope.event.path;
          var etag = $scope.event.etag;
          var emails = session.user.emails;

          calendarService.changeParticipation(path, vcalendar, emails, partstat, etag).then(function(shell) {
            $scope.partstat = partstat;
            if (shell) {
              $scope.event = shell;
            }
          });
        };

        function updateEvent() {
          calendarService.getEvent($scope.message.eventId).then(function(event) {
            // Set up dom nodes
            $scope.event = event;
            element.find('>div>div.loading').addClass('hidden');
            element.find('>div>div.message').removeClass('hidden');

            // Load participation status
            var vcalendar = event.vcalendar;
            var emails = session.user.emails;
            var attendees = calendarService.getInvitedAttendees(vcalendar, emails);
            var organizer = attendees.filter(function(att) {
              return att.name === 'organizer' && att.getParameter('partstat');
            });

            var attendee = organizer[0] || attendees[0];
            if (attendee) {
              $scope.partstat = attendee.getParameter('partstat');
            }
          }, function(response) {
            var error = 'Could not retrieve event: ' + response.statusText;
            element.find('>div>.loading').addClass('hidden');
            element.find('>div>.error').text(error).removeClass('hidden');
          });
        }
        updateEvent();
      }
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
      templateUrl: '/calendar/views/partials/event-create-button.html'
    };
  })
  .directive('calendarButtonToolbar', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/community/community-calendar-button-toolbar.html'
    };
  })
  .directive('messageEditionEventButton', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/message/event/message-edition-event-button.html'
    };
  })
  .directive('eventQuickFormWizard', function(WidgetWizard, $rootScope) {
    function link($scope, element) {
      $scope.wizard = new WidgetWizard([
        '/calendar/views/partials/event-quick-form-wizard-step-0'
      ]);
    }
    return {
      restrict: 'E',
      templateUrl: '/calendar/views/partials/event-quick-form-wizard',
      scope: {
        user: '=',
        domain: '=',
        createModal: '=',
        event: '='
      },
      link: link
    };
  })
  .directive('eventMessageEdition', function() {

    function link(scope, element, attrs, controller) {
      $scope.submit = controller.addNewEvent;
      $scope.getMinDate = controller.getMinDate;
      $scope.onStartDateChange = controller.onStartDateChange;
      $scope.onEndDateChange = controller.onEndDateChange;
      $scope.getMinTime = controller.getMinTime;
    }

    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/message/event/event-message-edition.html',
      controller: 'eventFormController',
      link: link
    };
  })
  .directive('eventQuickForm', function($timeout, $q, domainAPI, calendarUtils, session, ICAL_PROPERTIES, AUTOCOMPLETE_MAX_RESULTS) {
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
      templateUrl: '/calendar/views/partials/event-quick-form.html',
      link: link
    };
  })
  .directive('friendlifyEndDate', function(moment) {
    function link(scope, element, attrs, ngModel) {
      function _ToView(value) {
        if (scope.editedEvent.allDay) {
          var valueToDisplay = moment(new Date(value)).subtract(1, 'days').format('YYYY/MM/DD');
          ngModel.$setViewValue(valueToDisplay);
          ngModel.$render();
          return valueToDisplay;
        }
        return value;
      }

      function _toModel(value) {
        if (scope.editedEvent.allDay) {
          return moment(value).add(1, 'days');
        }
        return value;
      }

      /**
       * Ensure that the view has a userfriendly end date output by removing 1 day to the editedEvent.end
       * if it is an allDay. We must does it because fullCalendar uses exclusive date/time end date.
       */
      ngModel.$formatters.unshift(_ToView);

      /**
       * Ensure that if editedEvent is allDay, we had 1 days to editedEvent.end because fullCalendar and
       * caldav has exclusive date/time end date.
       */
      ngModel.$parsers.push(_toModel);
    }

    return {
      restrict: 'A',
      require: 'ngModel',
      link: link
    };
  })
  .directive('dateToMoment', function(moment) {
    function link(scope, element, attrs, controller) {
      function _toModel(value) {
        return moment(value);
      }

      /**
       * Ensure that we only are using moment type of date in hour code
       */
      controller.$parsers.unshift(_toModel);
    }

    return {
      restrict: 'A',
      require: 'ngModel',
      link: link
    };
  })
  .directive('calendarNavbarLink', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/user/user-calendar-navbar-link.html'
    };
  })
  .directive('attendeeListItem', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/attendee/attendee-list-item.html',
      controller: 'eventFormController',
      scope: {
        attendee: '=',
        readOnly: '='
      },
      link: function(scope) {
        scope.attendeeType = scope.attendee.name === scope.attendee.email ? 'email' : 'user';
      }
    };
  })
  .directive('calendarDisplay', function($timeout) {
    function link(scope, element) {
      $timeout(function() {
        var today = element.find('.fc-today-button');
        today.addClass('btn waves-effect');
        var buttonGroup = element.find('.fc-button-group');
        buttonGroup.addClass('btn-group');
        buttonGroup.children().addClass('btn waves-effect');
      }, 0);
    }
    return {
      restrict: 'E',
      templateUrl: 'calendar/views/partials/calendar.html',
      scope: {
        calendarId: '=',
        uiConfig: '='
      },
      controller: 'calendarController',
      link: link
    };
  });
