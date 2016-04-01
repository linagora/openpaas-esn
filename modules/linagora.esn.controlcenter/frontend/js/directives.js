'use strict';

angular.module('linagora.esn.controlcenter')

.directive('applicationMenuControlcenter', function(applicationMenuTemplateBuilder) {
  return {
    retrict: 'E',
    replace: true,
    template: applicationMenuTemplateBuilder('/#/controlcenter', 'mdi-settings', 'Control Center')
  };
})

.directive('controlcenterSidebar', function() {
  return {
    restrict: 'E',
    templateUrl: '/controlcenter/views/partials/sidebar'
  };
})

.directive('controlcenterSidebarMenuItem', function() {
  return {
    restrict: 'E',
    scope: {
      icon: '@',
      href: '@',
      label: '@'
    },
    templateUrl: '/controlcenter/views/partials/sidebar-menu-item'
  };
});
