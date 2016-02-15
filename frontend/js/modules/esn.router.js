'use strict';

angular.module('esn.router', ['ui.router'])
  .config(function($urlMatcherFactoryProvider) {
    // This option allows to have trailing slash at the end of the browser url.
    // It must be set before any configuration on $stateProvider or $urlRouterProvider.
    $urlMatcherFactoryProvider.strictMode(false);
  });
