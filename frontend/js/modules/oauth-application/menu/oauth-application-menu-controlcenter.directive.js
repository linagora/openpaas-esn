(function() {
  'use strict';

  angular.module('esn.oauth-application')
    .directive('esnOauthApplicationMenuControlcenter', esnOauthApplicationMenuControlcenter);

  function esnOauthApplicationMenuControlcenter(controlCenterMenuTemplateBuilder) {
    return {
      retrict: 'E',
      template: controlCenterMenuTemplateBuilder('controlcenter.oauth-application', 'mdi-apps', 'Applications')
    };
  }
})();
