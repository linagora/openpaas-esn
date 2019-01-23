(function(angular) {
  'use strict';

  angular.module('esn.community')
    .controller('ESNCommunityPendingInvitationDisplayController', ESNCommunityPendingInvitationDisplayController);

  function ESNCommunityPendingInvitationDisplayController($rootScope, $element, esnCollaborationClientService, ESN_COLLABORATION_MEMBER_EVENTS) {
    var self = this;

    self.cancel = cancel;
    var button = $element.find('.btn');

    function cancel() {
      button.attr('disabled', 'disabled');
      esnCollaborationClientService.cancelRequestMembership('community', self.community._id, self.request.user._id).then(function() {
        $element.remove();
        $rootScope.$emit(ESN_COLLABORATION_MEMBER_EVENTS.CANCEL);
      }, function() {
        button.removeAttr('disabled');
      });
    }
  }
})(angular);
