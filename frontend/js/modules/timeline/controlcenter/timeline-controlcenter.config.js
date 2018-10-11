(function(angular) {
  'use strict';

  angular.module('esn.timeline').config(config);

  function config(dynamicDirectiveServiceProvider) {
    var timelineControlCenterMenu = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'controlcenter-menu-timeline', { priority: -10 });

    dynamicDirectiveServiceProvider.addInjection('controlcenter-sidebar-menu', timelineControlCenterMenu);
  }

})(angular);
