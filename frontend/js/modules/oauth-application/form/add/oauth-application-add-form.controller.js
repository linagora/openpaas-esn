(function() {
  'use strict';

  angular.module('esn.oauth-application')
    .controller('ESNOauthApplicationAddFormController', ESNOauthApplicationAddFormController);

  function ESNOauthApplicationAddFormController($log, ESNOauthApplicationClient) {
    var self = this;

    self.create = create;
    self.application = {};

    function create() {
      return ESNOauthApplicationClient.create(self.application).then(function(response) {
        $log.debug('Successfully created new application', self.application);
        self.onCreated({application: response.data});
      }, function(err) {
        $log.error('Error while creating new application', err.data);
      });
    }
  }
})();
