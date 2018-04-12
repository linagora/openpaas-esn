(function() {
  'use strict';

  angular.module('esn.collaboration')
    .controller('CollaborationRequestMembershipActionUserNotificationController', CollaborationRequestMembershipActionUserNotificationController);

    function CollaborationRequestMembershipActionUserNotificationController(
      $scope,
      objectTypeResolver,
      esnUserNotificationService
    ) {
      $scope.error = false;
      $scope.loading = true;
      objectTypeResolver.resolve($scope.notification.complement.objectType, $scope.notification.complement.id)
        .then(function(result) {
          $scope.collaboration = result.data;
          $scope.collaboration.objectType = $scope.notification.complement.objectType;
          $scope.collaborationPath = getCollaborationPath($scope.notification.complement.objectType);

          esnUserNotificationService.setAcknowledged($scope.notification._id, true).then(
            function() {
              $scope.notification.acknowledged = true;
            },
            function(error) {
              $scope.error = error;
            }
          ).finally(function() {
            $scope.loading = false;
          });

        }, function() {
          $scope.error = true;
        }).finally(function() {
          $scope.loading = false;
        });

      // This needs to be refactored to support objectTypeAdapters
      // For now we hardcode it
      function getCollaborationPath(objectType) {
        return {
          community: 'community/view',
          'chat.conversation': 'chat/channels/view'
        }[objectType] || 'community';
      }
    }
})();
