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
    $stateProvider.state('/calendar/communities/:community_id', {
      url: '/calendar/communities/:community_id',
      templateUrl: '/calendar/views/calendar/community-calendar',
      controller: 'communityCalendarController',
      resolve: {
        community: routeResolver.api('communityAPI', 'get', 'community_id', '/communities')
      }
    })
    .state('calendar', {
      url: '/calendar',
      templateUrl: '/calendar/views/calendar/user-calendar',
      abstract: true,
      resolve: {
        user: routeResolver.session('user')
      },
      reloadOnSearch: false
    })
    .state('calendar.main', {
      url: '',
      views: {
        content: {
          template: '<calendar-view calendar-home-id="calendarHomeId" ui-config="uiConfig"/>',
          controller: function($scope, user, headerService, USER_UI_CONFIG) {
            $scope.calendarHomeId = user._id;
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
          templateUrl: '/calendar/views/calendar-configuration/calendar-edit',
          controller: 'calendarEditionController',
          resolve: {
            calendar: function($stateParams, calendarService, session) {
              return session.ready.then(function() {
                return calendarService.getCalendar(session.user._id, $stateParams.calendarId);
              });
            }
          }
        }
      }
    })
    .state('calendar.add', {
      url: '/add',
      views: {
        content: {
          templateUrl: '/calendar/views/calendar-configuration/calendar-edit',
          controller: 'calendarEditionController',
          resolve: {
            calendar: function() {
              return null;
            }
          }
        }
      }
    })
    .state('calendar.list', {
      url: '/list',
      views: {
        content: {
          templateUrl: 'calendar/views/calendar-configuration/calendars-edit',
          controller: 'calendarsEditionController',
          resolve: {
            calendars: function(session, calendarService) {
              return session.ready.then(function() {
                return calendarService.listCalendars(session.user._id);
              });
            }
          }
        }
      }
    })
    .state('calendar.event', {
      url: '/:calendarId/event/:eventId',
      views: {
        content: {
          template: '<event-full-form event="event"/>',
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
          },
          controller: function($scope, event) {
            $scope.event = event;
          }
        }
      }
    })
    .state('calendar.event.details', {
      url: '/:calendarId/event/:eventId/details',
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
