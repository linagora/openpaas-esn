'use strict';

angular.module('linagora.esn.login.oauth')

.directive('loginOauthFacebookButton', function() {
  return {
    restrict: 'E',
    templateUrl: '/login-oauth/views/buttons/facebook.html'
  };
});
