'use strict';

angular.module('linagora.esn.mute')
  .directive('applicationMenuMute', function(applicationMenuTemplateBuilder) {
    return {
      restrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/mute', 'mdi-pencil-box-outline', 'Mute')
    };
  })
  
  .directive('muteIframe', function(iFrameResize) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/mute/views/partials/mute-iframe',
      controller: 'muteIframeController',
      link: function(scope, element) {
        element.load(function(event) {
          iFrameResize({
            checkOrigin: false,
            inPageLinks: true,
            heightCalculationMethod: 'grow'
          }, element[0]);
        });
      }
    }
  })
;
