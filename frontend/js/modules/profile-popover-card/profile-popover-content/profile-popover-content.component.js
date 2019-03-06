(function(angular) {
  'use strict';

  angular.module('esn.profile-popover-card').component('profilePopoverContent', {
    templateUrl: '/views/modules/profile-popover-card/profile-popover-content/profile-popover-content.html',
    controller: 'profilePopoverContentController',
    bindings: {
      user: '<',
      isCurrentUser: '<',
      hideComponent: '&'
    }
  });
})(angular);
