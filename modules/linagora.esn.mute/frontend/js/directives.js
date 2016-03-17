'use strict';

angular.module('linagora.esn.mute')
  .directive('applicationMenuMute', function(applicationMenuTemplateBuilder) {
    return {
      retrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/mute', 'mdi-pencil-box-outline', 'Mute')
    };
  })
;
