'use strict';

angular.module('esn.calendar', [
  'ui.router',
  'esn.core',
  'esn.authentication',
  'esn.form.helper',
  'esn.ical',
  'esn.fcmoment',
  'esn.community',
  'restangular',
  'mgcrea.ngStrap.datepicker',
  'mgcrea.ngStrap.aside',
  'materialAdmin',
  'ui.bootstrap.tpls',
  'ui.bootstrap',
  'AngularJstz',
  'esn.notification',
  'esn.widget.helper',
  'uuid4',
  'ui.calendar',
  'ng.deviceDetector',
  'naturalSort'
])
  .config(function($stateProvider, routeResolver) {

    $stateProvider.state('/calendar/communities/:community_id', {
      url: '/calendar/communities/:community_id',
      templateUrl: '/calendar/views/calendar/community-calendar',
      controller: 'communityCalendarController',
      resolve: {
        community: routeResolver.api('communityAPI', 'get', 'community_id', '/communities')
      }
    })
    .state('/calendar/event-full-form', {
      url: '/calendar/event-full-form',
      templateUrl: '/calendar/views/event-full-form/event-full-form-view',
      resolve: {
        event: function(eventUtils) {
          return eventUtils.getEditedEvent();
        }
      },
      controller: 'eventFullFormController'
    })
    .state('calendar.edit.event', {
      url: '/:calendar_id/:event_id',
      templateUrl: '/calendar/views/event-full-form/event-full-form-view',
      resolve: {
        event: function($stateParams, $location, pathBuilder, calendarService, notificationFactory) {
          var eventPath = pathBuilder.forEventId($stateParams.calendar_id, $stateParams.event_id);
          return calendarService.getEvent(eventPath).catch(function(error) {
            notificationFactory.weakError('Cannot display this event.', error.statusText);
            $location.path('/calendar');
          });
        }
      },
      controller: 'eventFullFormController'
    })
    .state('/calendar', {
      url: '/calendar',
      templateUrl: '/calendar/views/calendar/user-calendar',
      controller: 'userCalendarController',
      resolve: {
        user: routeResolver.session('user')
      },
      reloadOnSearch: false
    })
    .state('calendaredit', {
      url: '/calendar/edit/:id',
      templateUrl: '/calendar/views/calendar-configuration/calendar-edit',
      controller: 'calendarEditionController',
      resolve: {
        calendar: function($stateParams, calendarService, session) {
          return session.ready.then(function() {
            return calendarService.getCalendar(session.user._id, $stateParams.id);
          });
        }
      }
    })
    .state('calendaradd', {
      url: '/calendar/add',
      templateUrl: '/calendar/views/calendar-configuration/calendar-edit',
      controller: 'calendarEditionController',
      resolve: {
        calendar: function() {
          return null;
        }
      }
    })
    .state('calendaredits', {
      url: '/calendar/calendars-edit',
      templateUrl: 'calendar/views/calendar-configuration/calendars-edit',
      controller: 'calendarsEditionController',
      resolve: {
        calendars: function(session, calendarService) {
          return session.ready.then(function() {
            return calendarService.listCalendars(session.user._id);
          });
        }
      }
    });
  });
