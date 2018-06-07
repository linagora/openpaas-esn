'use strict';

angular.module('linagora.esn.controlcenter', [
  'op.dynamicDirective',
  'esn.constants',
  'esn.router',
  'esn.user',
  'esn.subheader',
  'esn.sidebar',
  'esn.module-registry',
  'esn.user-configuration',
  'esn.business-hours',
  'esn.configuration',
  'esn.user-configuration',
  'esn.i18n'
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
