'use strict';

angular.module('esn.calendar', [
  'uuid4',
  'ui.calendar',
  'ng.deviceDetector',
  'naturalSort',
  'ngTouch',
  'restangular',
  'mgcrea.ngStrap.datepicker',
  'mgcrea.ngStrap.aside',
  'materialAdmin',
  'AngularJstz',
  'angularMoment',
  'matchMedia',
  'esn.router',
  'esn.core',
  'esn.header',
  'esn.authentication',
  'esn.form.helper',
  'esn.ical',
  'esn.fcmoment',
  'esn.community',
  'esn.notification',
  'esn.widget.helper',
  'esn.lodash-wrapper',
  'op.dynamicDirective'
])
  .config(function($stateProvider, routeResolver, dynamicDirectiveServiceProvider) {
    $stateProvider

    .state('calendarForCommunities', {
      url: '/calendar/communities/:community_id',
      templateUrl: '/calendar/views/calendar/community-calendar',
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
          controller: function($scope, community, headerService, USER_UI_CONFIG) {
            $scope.calendarHomeId = community._id;
            $scope.uiConfig = angular.copy(USER_UI_CONFIG);
            $scope.uiConfig.calendar.editable = false;
            $scope.uiConfig.calendar.selectable = false;
          }
        }
      }
    })

    .state('calendar', {
      url: '/calendar',
      templateUrl: '/calendar/views/calendar/user-calendar',
      abstract: true,
      resolve: {
        calendarHomeId: function($stateParams, calendarService, session) {
          return session.ready.then(function() {
            return session.user._id;
          });
        }
      },
      reloadOnSearch: false
    })
    .state('calendar.main', {
      url: '',
      views: {
        content: {
          template: '<calendar-view calendar-home-id="calendarHomeId" ui-config="uiConfig"/>',
          controller: function($scope, calendarHomeId, headerService, USER_UI_CONFIG) {
            $scope.calendarHomeId = calendarHomeId;
            $scope.uiConfig = angular.copy(USER_UI_CONFIG);

            headerService.mainHeader.addInjection('calendar-header-content');
            headerService.subHeader.addInjection('calendar-header-mobile');
          }
        }
      }
    })
    .state('calendar.edit', {
      url: '/edit/:calendarId',
      views: {
        content: {
          template: '<calendar-edit calendar-home-id="calendarHomeId" calendar="calendar"/>',
          resolve: {
            calendar: function($stateParams, calendarService, calendarHomeId) {
              return calendarService.getCalendar(calendarHomeId, $stateParams.calendarId);
            }
          },
          controller: function($scope, calendarHomeId, calendar) {
            $scope.calendarHomeId = calendarHomeId;
            $scope.calendar = calendar;
          }
        }
      }
    })
    .state('calendar.add', {
      url: '/add',
      views: {
        content: {
          template: '<calendar-edit calendar-home-id="calendarHomeId"/>',
          controller: function($scope, calendarHomeId) {
            $scope.calendarHomeId = calendarHomeId;
          }
        }
      }
    })
    .state('calendar.list', {
      url: '/list',
      views: {
        content: {
          template: '<calendars-edit calendars="calendars"/>',
          resolve: {
            calendars: function(calendarService, calendarHomeId) {
              return calendarService.listCalendars(calendarHomeId);
            }
          },
          controller: function($scope, calendars) {
            $scope.calendars = calendars;
          }
        }
      }
    })
    .state('calendar.event', {
      url: '/:calendarId/event/:eventId',
      abstract: true,
      views: {
        content: {
          template: '<div ui-view="content"/>'
        }
      },
      resolve: {
        event: function($stateParams, $state, pathBuilder, calendarService, eventUtils, notificationFactory) {
          var eventPath = pathBuilder.forEventId($stateParams.calendarId, $stateParams.eventId);
          return eventUtils.getEditedEvent() || calendarService.getEvent(eventPath).catch(function(error) {
            if (error.status !== 404) {
              notificationFactory.weakError('Cannot display the requested event, an error occured: ', error.statusText);
            }
            $state.go('calendar.main');
          });
        }
      }
    })
    .state('calendar.event.form', {
      url: '/form',
      views: {
        content: {
          template: '<event-full-form event="event"/>',
          controller: function($scope, event) {
            $scope.event = event;
          }
        }
      }
    })
    .state('calendar.event.consult', {
      url: '/consult',
      views: {
        content: {
          template: '<event-consult-form event="event"/>',
          controller: function($scope, event) {
            $scope.event = event;
          }
        }
      }
    });

    var calendar = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-calendar', {priority: 40});
    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', calendar);
  }).run(function($rootScope, headerService) {
    $rootScope.$on('$stateChangeStart', function() {
      headerService.resetAllInjections();
    });
  });
