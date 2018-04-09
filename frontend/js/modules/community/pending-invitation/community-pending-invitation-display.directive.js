(function(angular) {
  'use strict';

  angular.module('esn.community').directive('communityPendingInvitationDisplay', communityPendingInvitationDisplay);

  function communityPendingInvitationDisplay(esnCollaborationClientService) {
    return {
      restrict: 'E',
      scope: {
        request: '=',
        community: '='
      },
      templateUrl: '/views/modules/community/pending-invitation/community-pending-invitation-display.html',
      link: function($scope, $element) {
        var button = $element.find('.btn');

        $scope.cancel = function() {
          button.attr('disabled', 'disabled');
          esnCollaborationClientService.cancelRequestMembership('community', $scope.community._id, $scope.request.user._id).then(function() {
            button.hide();
          }, function() {
            button.removeAttr('disabled');
          });
        };
      }
    };
  }

})(angular);
