'use strict';

angular.module('linagora.esn.login.oauth')

  .run(function(dynamicDirectiveService) {
    dynamicDirectiveService.addInjection('esn-login-oauth', new dynamicDirectiveService.DynamicDirective(function() {
      return true;
    }, 'login-oauth-twitter-button'));
  })

  .directive('loginOauthTwitterButton', function() {
    return {
      restrict: 'E',
      templateUrl: '/login-oauth/views/buttons/twitter.html'
    };
  });
