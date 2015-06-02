'use strict';

angular.module('linagora.esn.contact', [
  'restangular', 'esn.alphalist'
]).config(['$routeProvider', 'routeResolver', function($routeProvider, routeResolver) {
  $routeProvider.when('/contacts', {
    templateUrl: '/contacts/views/contacts',
    controller: 'contactsListController',
    resolve: {
      domain: routeResolver.session('domain'),
      user: routeResolver.session('user')
    }
  });
  $routeProvider.when('/contacts/new/:bookId', {
    templateUrl: '/contacts/views/contact-new',
    controller: 'newContactController',
    resolve: {
      domain: routeResolver.session('domain'),
      user: routeResolver.session('user')
    }
  });
  $routeProvider.when('/contacts/:bookId/:cardId', {
    templateUrl: '/contacts/views/contact-show',
    controller: 'showContactController',
    resolve: {
      domain: routeResolver.session('domain'),
      user: routeResolver.session('user')
    }
  });
}]);
