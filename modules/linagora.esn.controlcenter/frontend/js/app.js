'use strict';

angular.module('linagora.esn.controlcenter', [
  'op.dynamicDirective',
  'esn.router',
  'esn.user'
])

.config(function($stateProvider, $urlRouterProvider, dynamicDirectiveServiceProvider) {
  $urlRouterProvider.when('/controlcenter', '/controlcenter/profile');

  $stateProvider
    .state('controlcenter', {
      url: '/controlcenter',
      templateUrl: '/controlcenter/views/controlcenter',
      controller: 'controlCenterController'
    });

  var controlCenter = new dynamicDirectiveServiceProvider.DynamicDirective(
    true, 'application-menu-controlcenter', { priority: -10 });

  dynamicDirectiveServiceProvider.addInjection('esn-application-menu', controlCenter);
});
