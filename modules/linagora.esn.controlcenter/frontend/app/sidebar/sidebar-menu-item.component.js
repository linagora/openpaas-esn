(function(angular) {
  'use strict';

  angular.module('linagora.esn.controlcenter')

  .component('controlcenterSidebarMenuItem', {
    bindings: {
      icon: '@',
      href: '@',
      label: '@'
    },
    templateUrl: '/controlcenter/app/sidebar/sidebar-menu-item'
  });
})(angular);
