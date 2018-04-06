(function(angular) {
  'use strict';

  angular.module('esn.community').directive('communityPendingInvitationList', communityPendingInvitationList);

  function communityPendingInvitationList(esnCollaborationClientService) {
    return {
      scope: {
        community: '='
      },
      restrict: 'E',
      templateUrl: '/views/modules/community/pending-invitation/community-pending-invitation-list.html',
      link: function($scope) {
        $scope.error = false;
        var calling = false;

        $scope.updatePendingRequestsList = function() {
          if (calling) {
            return;
          }
          calling = true;

          esnCollaborationClientService.getRequestMemberships('community', $scope.community._id, {}).then(function(response) {
            $scope.requests = response.data;
          }, function() {
            $scope.error = true;
          }).finally(function() {
            calling = false;
          });
        };

        $scope.updatePendingRequestsList();
      }
    };
  }

})(angular);
