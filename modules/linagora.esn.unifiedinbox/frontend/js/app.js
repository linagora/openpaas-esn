'use strict';

angular.module('linagora.esn.unifiedinbox', [])
  .config(function($routeProvider, routeResolver) {
    $routeProvider.when('/unifiedinbox', {
      templateUrl: '/unifiedinbox/views/partials/unifiedinbox'
    });
  });
