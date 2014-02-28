'use strict';

angular.module('signupApp', ['esn.invitation', 'restangular', 'ngRoute'])
  .config(function($routeProvider, RestangularProvider) {

    $routeProvider.when('/', {
      templateUrl: '/views/signup/partials/create',
      controller: 'signup'
    });

    $routeProvider.when('/:id', {
      templateUrl: '/views/signup/partials/finalize',
      controller: 'finalize',
      resolve: {
        invitation: function(invitationAPI, $route) {
          return invitationAPI.get($route.current.params.id).then(
            function(data) {
              return {
                status: 'success',
                data: data
              };
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

    RestangularProvider.setBaseUrl('/api');
  });
