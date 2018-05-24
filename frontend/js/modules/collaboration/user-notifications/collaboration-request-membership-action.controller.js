(function() {
  'use strict';

  angular.module('esn.collaboration')
    .controller('CollaborationRequestMembershipActionUserNotificationController', CollaborationRequestMembershipActionUserNotificationController);

    function CollaborationRequestMembershipActionUserNotificationController(
      objectTypeResolver
    ) {
      var self = this;

      self.$onInit = $onInit;

      function $onInit() {
        self.error = false;
        self.loading = true;

        objectTypeResolver.resolve(self.notification.complement.objectType, self.notification.complement.id)
          .then(function(result) {
            self.collaboration = result.data;
            self.collaboration.objectType = self.notification.complement.objectType;
            self.collaborationPath = getCollaborationPath(self.notification.complement.objectType);
          }, function(err) {
            if (err.status && err.status === 404) {
              self.notFound = true;
            } else {
              self.error = true;
            }
          }).finally(function() {
            self.loading = false;
            ack();
          });

          function ack() {
            return self.notification.setAcknowledged(true);
          }

          function getCollaborationPath(objectType) {
            return {
              community: 'community/view',
              'chat.conversation': 'chat/channels/view'
            }[objectType] || 'community';
          }
        }
      }
})();
