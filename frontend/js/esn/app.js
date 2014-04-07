'use strict';

angular.module('esnApp', ['restangular', 'ngRoute', 'esn.member'])
  .config(function($routeProvider, RestangularProvider) {

    $routeProvider.when('/', {
      templateUrl: '/views/esn/partials/home'
    });

    $routeProvider.when('/account', {
      templateUrl: '/views/esn/partials/account'
    });

    $routeProvider.when('/domains/:id/members', {
      templateUrl: '/views/esn/partials/members',
      controller: 'memberscontroller'
    });

    $routeProvider.otherwise({redirectTo: '/'});

    RestangularProvider.setBaseUrl('/api');
  });
