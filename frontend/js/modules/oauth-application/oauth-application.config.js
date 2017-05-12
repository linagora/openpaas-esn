(function() {
  'use strict';

  angular.module('esn.oauth-application')
    .config(configBlock);

  function configBlock(dynamicDirectiveServiceProvider) {
    var applicationControlCenterMenu = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'esn-oauth-application-menu-controlcenter', {priority: -10});

    dynamicDirectiveServiceProvider.addInjection('controlcenter-sidebar-menu', applicationControlCenterMenu);
  }
})();
