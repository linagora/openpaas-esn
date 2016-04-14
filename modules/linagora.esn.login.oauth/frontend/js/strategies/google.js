'use strict';

angular.module('linagora.esn.login.oauth')

  .run(function(dynamicDirectiveService) {
    dynamicDirectiveService.addInjection('esn-login-oauth', new dynamicDirectiveService.DynamicDirective(function() {
      return true;
    }, 'login-oauth-google-button'));
  })

  .directive('loginOauthGoogleButton', function() {
    return {
      restrict: 'E',
      templateUrl: '/login-oauth/views/buttons/google.html'
    };
  });
