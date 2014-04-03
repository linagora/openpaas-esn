'use strict';

angular.module('esnApp', ['esn.domain', 'restangular', 'ngRoute'])
  .config(function($routeProvider, RestangularProvider) {

    $routeProvider.when('/', {
      templateUrl: '/views/esn/partials/home'
    });

    $routeProvider.when('/members', {
      templateUrl: '/views/esn/partials/members'
    });

    $routeProvider.when('/domains/:id/members/invite', {
      templateUrl: '/views/esn/partials/domains/invite',
      controller: 'inviteMembers',
      resolve: {
        domain: function(domainAPI, $route, $location) {
          return domainAPI.isManager($route.current.params.id).then(
            function(data) {
              return data;
            },
            function(err) {
              $location.path('/');
            }
          );
        }
      }
    });

    $routeProvider.when('/account', {
      templateUrl: '/views/esn/partials/account'
    });

    $routeProvider.otherwise({redirectTo: '/'});

    RestangularProvider.setBaseUrl('/api');
  });
