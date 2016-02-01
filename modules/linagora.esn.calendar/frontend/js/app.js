'use strict';

angular.module('esn.calendar', [
  'ui.router',
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
    .state('calendar.eventEdit', {
      url: '/event-full-form',
      views: {
        form: {
          templateUrl: '/calendar/views/event-full-form/event-full-form-view',
          resolve: {
            event: function(eventUtils) {
              return eventUtils.getEditedEvent();
            }
          },
          controller: 'eventFullFormController'
        }
      }
    })
    .state('calendar.eventConsult', {
      url: '/event-consult-form',
      views: {
        form: {
          templateUrl: '/calendar/views/event-consult-form/event-consult-form'
        }
      }
    })
    .state('calendar', {
      url: '/calendar',
      templateUrl: '/calendar/views/calendar/user-calendar',
      controller: 'userCalendarController',
      abstract: true,
      resolve: {
        user: routeResolver.session('user')
      },
      reloadOnSearch: false
    })
    .state('calendar.main', {
      url: '',
      sticky: true,
      views: {
        calendar: {
          templateUrl: '/calendar/views/calendar/main-view-calendar'
        }
      },
      onReactivate: function(headerService, $timeout) {
        //$timeout needed otherwise it run before $scope.destroy of previous view's controller
        $timeout(function() {
          headerService.mainHeader.addInjection('calendar-header-content');
          headerService.subHeader.addInjection('calendar-header-mobile');
        });
      }
    })
    .state('calendar.edit', {
      url: '/edit/:id',
      views: {
        form: {
          templateUrl: '/calendar/views/calendar-configuration/calendar-edit',
          controller: 'calendarEditionController',
          resolve: {
            calendar: function($stateParams, calendarService, session) {
              return session.ready.then(function() {
                return calendarService.getCalendar(session.user._id, $stateParams.id);
              });
            }
          }
        }
      }
    })
    .state('calendar.add', {
      url: '/add',
      views: {
        form: {
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
      url: '/edits',
      views: {
        form: {
          controller: 'calendarsEditionController',
          templateUrl: 'calendar/views/calendar-configuration/calendars-edit',
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
      url: '/:calendar_id/:event_id',
      views: {
        form: {
          templateUrl: '/calendar/views/event-full-form/event-full-form-view',
          resolve: {
            event: function($stateParams, $state, pathBuilder, calendarService, notificationFactory) {
              var eventPath = pathBuilder.forEventId($stateParams.calendar_id, $stateParams.event_id);
              return calendarService.getEvent(eventPath).catch(function(error) {
                notificationFactory.weakError('Cannot display this event.', error.statusText);
                $state.go('calendar.main');
              });
            }
          },
          controller: 'eventFullFormController'
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
