'use strict';

angular.module('linagora.esn.profile')

  .directive('controlcenterMenuProfile', function(controlCenterMenuTemplateBuilder) {
    return {
      restrict: 'E',
      template: controlCenterMenuTemplateBuilder('controlcenter.profile', 'mdi-account', 'Profile')
    };
  });
