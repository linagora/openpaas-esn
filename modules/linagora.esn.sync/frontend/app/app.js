'use strict';

angular.module('linagora.esn.sync', [
  'op.dynamicDirective',
  'esn.core',
  'esn.ui',
  'ui.router',
  'linagora.esn.controlcenter'
])

  .config(function($stateProvider, dynamicDirectiveServiceProvider) {
    $stateProvider
      .state('controlcenter.sync', {
        url: '/sync',
        template: '<sync-main />'
      })
      .state('controlcenter.sync.android', {
        url: '/android',
        views: {
          sync: {
            template: '<sync-android />'
          }
        }
      })
      .state('controlcenter.sync.ios', {
        url: '/ios',
        views: {
          sync: {
            template: '<sync-ios />'
          }
        }
      })
      .state('controlcenter.sync.outlook', {
        url: '/outlook',
        views: {
          sync: {
            template: '<sync-outlook />'
          }
        }
      });

    var controlCenterMenuEntry = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'sync-controlcenter-menu-entry', { priority: -3 });

    dynamicDirectiveServiceProvider.addInjection('controlcenter-sidebar-menu', controlCenterMenuEntry);
  });
