'use strict';

angular.module('linagora.esn.contact', [
  'restangular', 'esn.alphalist', 'mgcrea.ngStrap.datepicker', 'mgcrea.ngStrap.alert', 'uuid4',
  'mgcrea.ngStrap.helpers.dateParser', 'mgcrea.ngStrap.helpers.dateFormatter', 'linagora.esn.graceperiod'
])
  .constant('DATE_FORMAT', 'MM/dd/yyyy')
  .config(function($routeProvider, routeResolver) {
  $routeProvider.when('/contact', {
    templateUrl: '/contact/views/contacts',
    controller: 'contactsListController',
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
  $routeProvider.when('/contact/show/:bookId/:cardId', {
    templateUrl: '/contact/views/contact-show',
    controller: 'showContactController',
    resolve: {
      domain: routeResolver.session('domain'),
      user: routeResolver.session('user')
    }
  });
  $routeProvider.when('/contact/edit/:bookId/:cardId', {
    templateUrl: '/contact/views/contact-edit',
    controller: 'editContactController',
    resolve: {
      domain: routeResolver.session('domain'),
      user: routeResolver.session('user')
    }
  });
});
