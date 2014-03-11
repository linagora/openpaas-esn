'use strict';

// REMOVE IT

angular.module('loginApp', ['esn.login', 'restangular', 'ngRoute'])
  .config(function($routeProvider, RestangularProvider) {
    RestangularProvider.setBaseUrl('/api');
  });

