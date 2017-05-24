// configure Angular app in production mode
// see more: https://docs.angularjs.org/guide/production
// this file is included in production mode only

(function(angular) {
  'use strict';

  angular.module('esn.production', [])

  .config(function($compileProvider, $logProvider) {
    $compileProvider.debugInfoEnabled(false);
    $logProvider.debugEnabled(false);
  });
})(angular);
