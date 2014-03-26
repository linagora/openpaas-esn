'use strict';

angular.module('welcomeApp', ['esn.login', 'esn.invitation', 'esn.company', 'restangular', 'ngRoute'])
  .config(function($routeProvider, RestangularProvider) {

    $routeProvider.when('/signup/:id', {
      templateUrl: '/views/welcome/partials/finalize',
      controller: 'finalize',
      resolve: {
        invitation: function(invitationAPI, $route) {
          return invitationAPI.get($route.current.params.id).then(
            function(data) {
              return data;
            },
            function(err) {
              return {
                status: 'error',
                error: err
              };
            }
          );
        }
      }
    });

    $routeProvider.when('/login', {
      templateUrl: '/views/login/partials/home'
    });

    $routeProvider.when('/', {
      templateUrl: '/views/welcome/partials/home'
    });

    $routeProvider.when('/confirm', {
      templateUrl: '/views/welcome/partials/confirm'
    });

    $routeProvider.otherwise({redirectTo: '/'});

    RestangularProvider.setBaseUrl('/api');
  });
