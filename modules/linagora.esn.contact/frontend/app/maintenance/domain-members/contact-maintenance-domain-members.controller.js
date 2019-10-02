(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('contactMaintenanceDomainMembersController', contactMaintenanceDomainMembersController);

  function contactMaintenanceDomainMembersController(asyncAction, contactMaintenanceDomainMembersService, $stateParams) {
    var self = this;
    var notificationMessages = {
      progressing: 'Submitting request...',
      success: 'Request submitted',
      failure: 'Failed to submit request'
    };

    self.onSyncBtnClick = onSyncBtnClick;
    self.$onInit = $onInit;

    function $onInit() {
      self.domainId = $stateParams.domainId === 'platform' || !$stateParams.domainId ? '' : $stateParams.domainId;
    }

    function onSyncBtnClick() {
      return asyncAction(notificationMessages, function() {
        if (self.domainId) {
          return contactMaintenanceDomainMembersService.synchronizeForDomain(self.domainId);
        }

        return contactMaintenanceDomainMembersService.synchronize();
      });
    }
  }
})(angular);
