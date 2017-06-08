(function() {
  'use strict';

  angular.module('linagora.esn.user-status')
    .controller('userStatusBubbleController', userStatusBubbleController);

  function userStatusBubbleController($scope, userStatusService, USER_STATUS_EVENTS, USER_STATUS) {
    var self = this;

    self.$onInit = setUserStatus;
    self.$onChanges = setUserStatus;

    $scope.$on(USER_STATUS_EVENTS.USER_CHANGE_STATE, function(event, data) {
      if (data[self.userId]) {
        self.status = data[self.userId].status;
      }
    });

    function setUserStatus() {
      userStatusService.getCurrentStatus(self.userId).then(function(status) {
        self.status = status.status;
      }, function() {
        self.status = USER_STATUS.unknown;
      });
    }
}

})();
