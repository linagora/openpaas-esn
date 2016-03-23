'use strict';

angular.module('linagora.esn.profile')

  .directive('applicationMenuProfile', function(applicationMenuTemplateBuilder) {
    return {
      retrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/profile', 'mdi-account', 'Profile')
    };
  });
