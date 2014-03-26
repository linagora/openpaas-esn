'use strict';

angular.module('esnApp', ['restangular', 'ngRoute'])
  .config(function($routeProvider, RestangularProvider) {

    $routeProvider.when('/', {
      templateUrl: '/views/esn/partials/home'
    });

    $routeProvider.when('/members', {
      templateUrl: '/views/esn/partials/members'
    });

    $routeProvider.when('/account', {
      templateUrl: '/views/esn/partials/account'
    });

    $routeProvider.otherwise({redirectTo: '/'});

    RestangularProvider.setBaseUrl('/api');
  });
