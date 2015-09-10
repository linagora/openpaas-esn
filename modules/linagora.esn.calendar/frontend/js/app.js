'use strict';

angular.module('esn.calendar', [
  'esn.core',
  'esn.authentication',
  'esn.ical',
  'esn.community',
  'restangular',
  'mgcrea.ngStrap.datepicker',
  'angularMoment',
  'AngularJstz',
  'esn.notification',
  'esn.widget.helper',
  'uuid4',
  'ui.calendar'
])
  .config(function($routeProvider, routeResolver) {

    $routeProvider.when('/calendar/communities/:community_id', {
      templateUrl: '/calendar/views/calendar/community-calendar',
      controller: 'communityCalendarController',
      resolve: {
        community: routeResolver.api('communityAPI', 'get', 'community_id', '/communities')
      }
    });

    $routeProvider.when('/calendar/event-full-form', {
      templateUrl: '/calendar/views/event-full-form/event-full-form',
      controller: 'eventFullFormController'
    });

    $routeProvider.when('/calendar', {
      templateUrl: '/calendar/views/calendar/user-calendar',
      controller: 'userCalendarController',
      resolve: {
        user: routeResolver.session('user')
      }
    });

  });
