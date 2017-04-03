(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxIdentityController', function(inboxIdentitiesService, asyncAction) {
      var self = this;

      self.$onInit = $onInit;
      self.removeIdentity = removeIdentity;

      /////

      function $onInit() {
        inboxIdentitiesService.getIdentity(self.identityId).then(function(identity) {
          self.identity = identity;
        });
      }

      function removeIdentity() {
        return asyncAction({
          progressing: 'Removing identity...',
          success: 'Identity removed',
          failure: 'Could not remove identity'
        }, function() {
          return inboxIdentitiesService.removeIdentity(self.identity);
        });
      }
    });

})();
