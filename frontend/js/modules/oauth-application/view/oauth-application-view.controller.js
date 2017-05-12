(function() {
  'use strict';

  angular.module('esn.oauth-application')
    .controller('ESNOauthApplicationViewController', ESNOauthApplicationViewController);

  function ESNOauthApplicationViewController($log, $stateParams, ESNOauthApplicationClient) {
    var self = this;

    self.$onInit = $onInit;
    self.revokeTokens = revokeTokens;
    self.resetClientSecret = resetClientSecret;

    function $onInit() {
      ESNOauthApplicationClient.get($stateParams.application_id).then(function(result) {
        self.application = result.data;
      }, function(err) {
        $log.error('Can not get application', err);
      });
    }

    function revokeTokens() {
      $log.debug('Revoke tokens for application', self.application);
    }

    function resetClientSecret() {
      $log.debug('Reset client secret for application', self.application);
    }
  }
})();
