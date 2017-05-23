(function() {
  'use strict';

  angular.module('esn.calendar')
    .config(routesConfig);

  function routesConfig($stateProvider, routeResolver) {
    $stateProvider
      .state('calendarForCommunities', {
        url: '/calendar/communities/:community_id',
        templateUrl: '/calendar/app/calendar/community-calendar',
        abstract: true,
        resolve: {
          community: routeResolver.api('communityAPI', 'get', 'community_id', '/communities')
        },
        reloadOnSearch: false
      })
      .state('calendarForCommunities.main', {
        url: '',
        views: {
          content: {
            template: '<calendar-view calendar-home-id="calendarHomeId" ui-config="uiConfig"/>',
            controller: function($scope, community, CAL_UI_CONFIG) {
              $scope.calendarHomeId = community._id;
              $scope.uiConfig = angular.copy(CAL_UI_CONFIG);
              $scope.uiConfig.calendar.editable = false;
              $scope.uiConfig.calendar.selectable = false;
            }
          }
        }
      })

      .state('calendar', {
        url: '/calendar',
        templateUrl: '/calendar/app/calendar/user-calendar',
        abstract: true,
        resolve: {
          calendarHomeId: function(calendarHomeService) {
            return calendarHomeService.getUserCalendarHomeId();
          },
          businessHours: function(calendarHomeService) {
            return calendarHomeService.getUserBusinessHours();
          }
        },
        controller: function($scope, calendarHomeId) {
          $scope.calendarHomeId = calendarHomeId;
        },
        reloadOnSearch: false
      })
      .state('calendar.main', {
        url: '',
        views: {
          content: {
            templateUrl: '/calendar/app/calendar/calendar-main',
            controller: function($scope, calendarHomeId, businessHours, CAL_UI_CONFIG) {
              $scope.calendarHomeId = calendarHomeId;
              $scope.uiConfig = angular.copy(CAL_UI_CONFIG);
              $scope.uiConfig.calendar.businessHours = businessHours;
              $scope.uiConfig.calendar.scrollTime = businessHours[0].start;
            }
          }
        }
      })
      .state('calendar.edit', {
        url: '/edit/:calendarUniqueId',
        params: {
          addUsersFromDelegationState: null
        },
        views: {
          content: {
            template: '<calendar-configuration />'
          }
        }
      })
      .state('calendar.edit.delegation', {
        url: '/delegation',
        params: {
          newUsersGroups: null,
          delegationTypes: null
        },
        views: {
          'content@calendar': {
            template: '<calendar-edit-delegation-add-users />'
          }
        }
      })
      .state('calendar.add', {
        url: '/add',
        views: {
          content: {
            template: '<calendar-configuration />'
          }
        }
      })
      .state('calendar.external', {
        url: '/external',
        deepStateRedirect: {
          default: 'calendar.main',
          fn: function() {
            return { state: 'calendar.main' };
          }
        }
      })
      .state('calendar.external.public', {
        url: '/public/:calendarUniqueId',
        views: {
          'content@calendar': {
            template: '<calendar-configuration/>'
          }
        }
      })
      .state('calendar.external.shared', {
        url: '/shared/:calendarUniqueId',
        views: {
          'content@calendar': {
            template: '<calendar-configuration />'
          }
        }
      })
      .state('calendar.list', {
        url: '/list',
        views: {
          content: {
            template: '<calendars-configuration-mobile calendars="calendars"/>'
          }
        }
      })
      .state('calendar.event', {
        url: '/:calendarHomeId/event/:eventId?recurrenceId',
        abstract: true,
        views: {
          content: {
            template: '<div ui-view="content"/>'
          }
        },
        params: {
          recurrenceId: null
        },
        resolve: {
          event: function($log, $q, $stateParams, $state, calPathBuilder, calEventService, calEventUtils, notificationFactory) {
            var eventPath = calPathBuilder.forEventId($stateParams.calendarHomeId, $stateParams.eventId);
            var editedEvent = calEventUtils.getEditedEvent();

            if (editedEvent && Object.keys(editedEvent).length) {
              return editedEvent;
            }

            return calEventService.getEvent(eventPath).then(function(event) {
              if ($stateParams.recurrenceId) {
                event = event.getExceptionByRecurrenceId($stateParams.recurrenceId);
              }

              if (!event) {
                return $q.reject(new Error('Event not found', eventPath));
              }

              return event;
            }).catch(function(error) {
              $log.error('Can not display the requested event', error);
              notificationFactory.weakError('Can not display the event');
              $state.go('calendar.main');
            });
          }
        }
      })
      .state('calendar.event.form', {
        url: '/form',
        views: {
          content: {
            template: '<cal-event-full-form event="event" calendar-home-id="calendarHomeId"/>',
            controller: function($scope, calendarHomeId, event) {
              $scope.calendarHomeId = calendarHomeId;
              $scope.event = event;
            }
          }
        }
      })
      .state('calendar.event.consult', {
        url: '/consult',
        views: {
          content: {
            template: '<cal-event-consult-form event="event" calendar-home-id="calendarHomeId"/>',
            controller: function($scope, event) {
              $scope.event = event;
            }
          }
        }
      });
  }
})();
