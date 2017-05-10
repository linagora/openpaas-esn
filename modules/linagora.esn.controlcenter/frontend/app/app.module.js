'use strict';

angular.module('linagora.esn.controlcenter', [
  'op.dynamicDirective',
  'angularMoment',
  'angular-clockpicker',
  'esn.router',
  'esn.user',
  'esn.subheader',
  'esn.sidebar',
  'esn.module-registry',
  'esn.configuration',
  'esn.user-configuration'
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
