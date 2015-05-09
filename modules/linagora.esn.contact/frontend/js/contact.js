'use strict';

angular.module('linagora.esn.contact', [
  'restangular'
]).config(['$routeProvider', 'routeResolver', function($routeProvider, routeResolver) {
  $routeProvider.when('/contacts', {
    templateUrl: '/contacts/views/contacts',
    controller: 'contactController',
    resolve: {
      domain: routeResolver.session('domain'),
      user: routeResolver.session('user')
    }
  });
}]);
