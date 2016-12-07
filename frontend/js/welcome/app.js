'use strict';

var angularInjections = window.angularInjections || [];

angular.module('welcomeApp', [
    'esn.login',
    'esn.invitation',
    'esn.company',
    'esn.http',
    'ngRoute',
    'materialAdmin',
    'op.dynamicDirective',
    'esn.ui'
  ].concat(angularInjections))
  .config(function($routeProvider) {

    $routeProvider.when('/login', {
      templateUrl: '/views/welcome/partials/home'
    });

    $routeProvider.when('/', {
      templateUrl: '/views/welcome/partials/home'
    });

    $routeProvider.otherwise({
      redirectTo: function(params, path) {
        return '/?continue=' + path;
      }
    });
  });
