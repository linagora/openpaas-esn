(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxIdentitiesController', function(inboxIdentitiesService) {
      var self = this;

      self.$onInit = $onInit;

      /////

      function $onInit() {
        inboxIdentitiesService.getAllIdentities().then(function(identities) {
          self.identities = identities;
        });
      }
    });

})();
