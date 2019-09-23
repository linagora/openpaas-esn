(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('contactMaintenanceDomainMembersController', contactMaintenanceDomainMembersController);

  function contactMaintenanceDomainMembersController(asyncAction, contactMaintenanceDomainMembersService) {
    var self = this;
    var notificationMessages = {
      progressing: 'Submitting request...',
      success: 'Request submitted',
      failure: 'Failed to submit request'
    };

    self.onSyncBtnClick = onSyncBtnClick;

    function onSyncBtnClick() {
      return asyncAction(notificationMessages, function() {
        return contactMaintenanceDomainMembersService.synchronize();
      });
    }
  }
})(angular);
