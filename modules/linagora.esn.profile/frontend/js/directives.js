'use strict';

angular.module('linagora.esn.profile')

  .directive('applicationMenuProfile', function(applicationMenuTemplateBuilder) {
    return {
      retrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/profile', 'mdi-account', 'Profile')
    };
  })

  .directive('controlcenterMenuProfile', function(controlCenterMenuTemplateBuilder) {
    return {
      restrict: 'E',
      template: controlCenterMenuTemplateBuilder('/#/profile', 'mdi-account', 'Profile')
    };
  });
