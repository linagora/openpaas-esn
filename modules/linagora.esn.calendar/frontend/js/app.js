'use strict';

angular.module('esn.calendar', [
  'esn.authentication',
  'esn.ical',
  'esn.community',
  'restangular',
  'mgcrea.ngStrap.datepicker',
  'angularMoment',
  'uuid4',
  'ui.calendar'
])
  .config(function($routeProvider, routeResolver) {
    $routeProvider.when('/calendar/communities/:community_id', {
      templateUrl: '/calendar/views/modules/community/community-calendar',
      controller: 'communityCalendarController',
      resolve: {
        community: routeResolver.api('communityAPI', 'get', 'community_id', '/communities')
      }
    });
    $routeProvider.when('/calendars', {
      templateUrl: '/calendar/views/partials/calendars',
      controller: 'userCalendarController',
      resolve: {
        user: routeResolver.session('user')
      }
    });
  });

