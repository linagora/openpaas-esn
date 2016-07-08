'use strict';

angular.module('linagora.esn.admin', [
  'esn.router',
  'esn.core'
  ])
  .config(function($stateProvider) {
    $stateProvider.state('admin', {
      url: '/admin',
      templateUrl: '/admin/views/index'
    });
  });
