'use strict';

angular.module('linagora.esn.controlcenter', [
  'op.dynamicDirective',
  'esn.router',
  'esn.user',
  'esn.lodash-wrapper'
])

.config(function($stateProvider, dynamicDirectiveServiceProvider) {
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
