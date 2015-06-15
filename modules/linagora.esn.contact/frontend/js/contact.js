'use strict';

angular.module('linagora.esn.contact', [
  'restangular', 'esn.alphalist', 'mgcrea.ngStrap.datepicker', 'ui.identicon'
]).config(['$routeProvider', 'routeResolver', function($routeProvider, routeResolver) {
  $routeProvider.when('/contact/list', {
    templateUrl: '/contact/views/contacts',
    controller: 'contactsListController',
    resolve: {
      domain: routeResolver.session('domain'),
      user: routeResolver.session('user')
    }
  });
  $routeProvider.when('/contact', {
    templateUrl: '/contact/views/contacts-card',
    controller: 'contactsCardsController',
    resolve: {
      domain: routeResolver.session('domain'),
      user: routeResolver.session('user')
    }
  });
  $routeProvider.when('/contact/new/:bookId', {
    templateUrl: '/contact/views/contact-new',
    controller: 'newContactController',
    resolve: {
      domain: routeResolver.session('domain'),
      user: routeResolver.session('user')
    }
  });
  $routeProvider.when('/contact/:bookId/:cardId', {
    templateUrl: '/contact/views/contact-show',
    controller: 'showContactController',
    resolve: {
      domain: routeResolver.session('domain'),
      user: routeResolver.session('user')
    }
  });
}]);
