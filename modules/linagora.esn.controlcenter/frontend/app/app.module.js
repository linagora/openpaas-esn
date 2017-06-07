'use strict';

angular.module('linagora.esn.controlcenter', [
  'op.dynamicDirective',
  'esn.router',
  'esn.user',
  'esn.subheader',
  'esn.sidebar',
  'esn.module-registry',
  'esn.user-configuration',
  'esn.business-hours'
])

.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.when('/controlcenter', '/controlcenter/general');

  $stateProvider
    .state('controlcenter', {
      url: '/controlcenter',
      templateUrl: '/controlcenter/app/app'
    })
    .state('controlcenter.general', {
      url: '/general',
      views: {
        'root@controlcenter': {
          template: '<controlcenter-general />'
        }
      }
    });
});
