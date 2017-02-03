'use strict';

angular.module('linagora.esn.sync')

  .directive('syncControlcenterMenuEntry', function(controlCenterMenuTemplateBuilder) {
    return {
      restrict: 'E',
      template: controlCenterMenuTemplateBuilder('controlcenter.sync', 'mdi-sync', 'Sync')
    };
  });
