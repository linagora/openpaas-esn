'use strict';

angular.module('esn.calendar')
  .directive('eventMessage', ['$rootScope', 'calendarService', 'session', 'moment', function($rootScope, calendarService, session, moment) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/message/templates/eventMessage.html',
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
  }])
  .directive('eventButtonCreate', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        community: '=',
        user: '='
      },
      templateUrl: '/calendar/views/partials/event-button-creation.html'
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
  .directive('eventCreateWizard', ['widget.wizard', '$rootScope',
    function(Wizard, $rootScope) {
      function link($scope, element) {
        $scope.wizard = new Wizard([
          '/calendar/views/partials/event-creation-wizard'
        ]);
        $rootScope.$on('modal.show', function() {
          element.find('input[ng-model="event.title"]')[0].focus();
        });
        $scope.rows = 1;
      }
      return {
        restrict: 'E',
        templateUrl: '/calendar/views/partials/event-create',
        scope: {
          user: '=',
          domain: '=',
          createModal: '=',
          event: '=',
          deleteEvent: '='
        },
        link: link
      };
    }
  ])
  .directive('eventEdition', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/message/event/event-edition.html'
    };
  })
  .directive('eventForm', ['widget.wizard', '$rootScope', '$alert', 'calendarService', 'dateService', 'calendarEventSource', 'moment',
    function(Wizard, $rootScope, $alert, calendarService, dateService, calendarEventSource, moment) {
      function link($scope, element) {
        $scope.rows = 1;
        console.log('clicked event: ', $scope.event);
        if (!$scope.event) {
          $scope.event = {
            startDate: dateService.getNewDate(),
            endDate: dateService.getNewEndDate(),
            allday: false
          };
          $scope.deleteEventAction = true;
        } else {
          $scope.event.startDate = $scope.event.start;
          $scope.event.endDate = $scope.event.end;
          $scope.deleteEventAction = false;
        }
        $scope.expand = function() {
          $scope.rows = 5;
        };

        $scope.shrink = function() {
          if (!$scope.event.description) {
            $scope.rows = 1;
          }
        };

        $scope.displayError = function(err) {
          $alert({
            content: err,
            type: 'danger',
            show: true,
            position: 'bottom',
            container: element.find('.event-create-error-message'),
            duration: '2',
            animation: 'am-flip-x'
          });
        };

        $scope.addNewEvent = function() {
          if (!$scope.event.title || $scope.event.title.trim().length === 0) {
            $scope.displayError('You must define an event title');
            return;
          }
          if (!$scope.calendarId) {
            $scope.calendarId = calendarService.calendarId;
          }
          var event = $scope.event;
          var path = '/calendars/' + $scope.calendarId + '/events';
          var vcalendar = calendarService.shellToICAL(event);
          calendarService.create(path, vcalendar).then(function(response) {
            if ($scope.activitystream) {
              $rootScope.$emit('message:posted', {
                activitystreamUuid: $scope.activitystream.activity_stream.uuid,
                id: response.headers('ESN-Message-Id')
              });
            }

            if ($scope.createModal) {
              $scope.createModal.hide();
            }
          }, function(err) {
            $scope.displayError(err);
          });
        };

        $scope.deleteEvent = function() {
          if (!$scope.calendarId) {
            $scope.calendarId = calendarService.calendarId;
          }
          var path = '/calendars/' + $scope.calendarId + '/events';
          calendarService.remove(path, $scope.event).then(function(response) {
            if ($scope.activitystream) {
              $rootScope.$emit('message:posted', {
                activitystreamUuid: $scope.activitystream.activity_stream.uuid,
                id: response.headers('ESN-Message-Id')
              });
            }

            if ($scope.createModal) {
              $scope.createModal.hide();
            }
          }, function(err) {
          });
        };

        $scope.resetEvent = function() {
          $scope.rows = 1;
          $scope.event = {
            startDate: dateService.getNewDate(),
            endDate: dateService.getNewEndDate(),
            diff: 1,
            allday: false
          };
        };

        $scope.getMinDate = function() {
          if ($scope.event.startDate && $scope.deleteEventAction) {
            var date = new Date($scope.event.startDate.getTime());
            date.setDate($scope.event.startDate.getDate() - 1);
            return date;
          }
          return null;
        };

        $scope.onStartDateChange = function() {
          var startDate = moment($scope.event.startDate);
          var endDate = moment($scope.event.endDate);

          if (startDate.isAfter(endDate)) {
            startDate.add(1, 'hours');
            $scope.event.endDate = startDate.toDate();
          }
        };

        $scope.onStartTimeChange = function() {

          if (dateService.isSameDay($scope.event.startDate, $scope.event.endDate)) {
            var startDate = moment($scope.event.startDate);
            var endDate = moment($scope.event.endDate);

            if (startDate.isAfter(endDate) || startDate.isSame(endDate)) {
              startDate.add($scope.event.diff || 1, 'hours');
              $scope.event.endDate = startDate.toDate();
            } else {
              endDate = moment(startDate);
              endDate.add($scope.event.diff || 1, 'hours');
              $scope.event.endDate = endDate.toDate();
            }
          }
        };

        $scope.onEndTimeChange = function() {

          if (dateService.isSameDay($scope.event.startDate, $scope.event.endDate)) {
            var startDate = moment($scope.event.startDate);
            var endDate = moment($scope.event.endDate);

            if (endDate.isAfter(startDate)) {
              $scope.event.diff = $scope.event.endDate.getHours() - $scope.event.startDate.getHours();
            } else {
              $scope.event.diff = 1;
              endDate = moment(startDate);
              endDate.add($scope.event.diff, 'hours');
              $scope.event.endDate = endDate.toDate();
            }
          }
        };
      }

      return {
        restrict: 'E',
        replace: true,
        templateUrl: '/calendar/views/partials/event-form.html',
        link: link
      };
    }
  ])
  .directive('calendarNavbarLink', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/user/user-calendar-navbar-link.html'
    };
  });
