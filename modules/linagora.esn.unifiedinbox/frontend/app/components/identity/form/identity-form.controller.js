(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxIdentityFormController', function($state, inboxIdentitiesService, asyncAction) {
      var self = this;

      self.$onInit = $onInit;
      self.saveIdentity = saveIdentity;

      /////

      function $onInit() {
        if (self.identityId) {
          inboxIdentitiesService.getIdentity(self.identityId).then(function(identity) {
            self.identity = identity;
          });
        } else {
          self.identity = {};
        }
      }

      function saveIdentity() {
        $state.go('unifiedinbox.configuration.identities');

        return asyncAction({
          progressing: 'Saving identity...',
          success: 'Identity saved',
          failure: 'Could not save identity'
        }, function() {
          return inboxIdentitiesService.storeIdentity(self.identity);
        });
      }
    });

})();
