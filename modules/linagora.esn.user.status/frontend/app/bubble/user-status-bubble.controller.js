(function() {
  'use strict';

  angular.module('linagora.esn.user-status')
    .controller('userStatusBubbleController', userStatusBubbleController);

  function userStatusBubbleController($scope, userStatusService, USER_STATUS_EVENTS, USER_STATUS) {
    var self = this;

    self.$onInit = $onInit;

    var unbind = $scope.$on(USER_STATUS_EVENTS.USER_CHANGE_STATE, function(event, data) {
      if (data.userId === self.userId) {
        self.status = data.status.current_status;
      }
    });

    $scope.$on('$destroy', unbind);

    function $onInit() {
      userStatusService.getCurrentStatus(self.userId).then(function(status) {
        self.status = status;
      }, function() {
        self.status = USER_STATUS.unknown;
      });
    }
  }

})();
