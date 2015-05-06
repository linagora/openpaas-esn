'use strict';

angular.module('linagora.esn.contact', [
  'restangular',
  'esn.avatar',
  'esn.session',
  'esn.core',
  'esn.activitystreams-tracker',
  'esn.notification',
  'angularFileUpload',
  'mgcrea.ngStrap.tooltip',
  'mgcrea.ngStrap.helpers.dimensions',
  'mgcrea.ngStrap.helpers.dateParser',
  'mgcrea.ngStrap.datepicker'
])
  .config(['$routeProvider', 'routeResolver', function($routeProvider, routeResolver) {
    $routeProvider.when('/contacts', {
      templateUrl: '/contacts/views/contacts',
      controller: 'contactController',
      resolve: {
        domain: routeResolver.session('domain'),
        user: routeResolver.session('user')
      }
    });
  }])
  .run(['contactAdapterService', 'objectTypeAdapter', 'ASTrackerSubscriptionService', 'contactAPI', function(contactAdapterService, objectTypeAdapter, ASTrackerSubscriptionService, contactAPI) {
    ASTrackerSubscriptionService.register('contact', {get: contactAPI.get});
  }]);
