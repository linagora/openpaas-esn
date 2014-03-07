'use strict';

angular.module('welcomeApp', ['esn.invitation', 'esn.company', 'restangular', 'ngRoute'])
  .config(function($routeProvider, RestangularProvider) {

    $routeProvider.when('/signup/:id', {
      templateUrl: '/views/signup/partials/finalize',
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

    $routeProvider.when('/', {
      templateUrl: '/views/welcome/partials/home'
    });

    $routeProvider.otherwise({redirectTo: '/'});

    RestangularProvider.setBaseUrl('/api');
  });
