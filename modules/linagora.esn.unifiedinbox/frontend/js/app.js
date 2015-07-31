'use strict';

angular.module('linagora.esn.unifiedinbox', ['esn.jmap-js'])
  .config(function($routeProvider, routeResolver) {
    $routeProvider.when('/unifiedinbox', {
      templateUrl: '/unifiedinbox/views/partials/unifiedinbox'
    });
  });
