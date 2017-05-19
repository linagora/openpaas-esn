(function() {
  'use strict';

  angular.module('esn.oauth-application')
    .controller('ESNOauthApplicationEditFormController', ESNOauthApplicationEditFormController);

  function ESNOauthApplicationEditFormController($log) {
    var self = this;

    self.update = update;
    self.remove = remove;

    function update() {
      $log.debug('Update application', self.application);
    }

    function remove() {
      $log.debug('Delete application', self.application);
    }
  }
})();
