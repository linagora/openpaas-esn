'use strict';

angular.module('linagora.esn.login.oauth', [
  'op.dynamicDirective'
])
  .run(function(dynamicDirectiveService) {
    dynamicDirectiveService.addInjection('esn-login-oauth', new dynamicDirectiveService.DynamicDirective(function() {
      return true;
    }, 'login-oauth-facebook-button'));
  });
