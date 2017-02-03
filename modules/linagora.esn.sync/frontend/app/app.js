'use strict';

angular.module('linagora.esn.sync', [
  'op.dynamicDirective',
  'esn.core',
  'esn.ui',
  'linagora.esn.controlcenter'
])

  .config(function($stateProvider, dynamicDirectiveServiceProvider) {
    $stateProvider.state('controlcenter.sync', {
      url: '/sync',
      template: '<sync-main />'
    });

    var controlCenterMenuEntry = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'sync-controlcenter-menu-entry', { priority: -3 });

    dynamicDirectiveServiceProvider.addInjection('controlcenter-sidebar-menu', controlCenterMenuEntry);
  });
