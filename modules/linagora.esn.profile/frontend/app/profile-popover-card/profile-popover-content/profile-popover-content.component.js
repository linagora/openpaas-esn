(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile').component('profilePopoverContent', {
    templateUrl: '/profile/app/profile-popover-card/profile-popover-content/profile-popover-content.html',
    controller: 'profilePopoverContentController',
    bindings: {
      user: '<',
      isCurrentUser: '<',
      hideComponent: '&'
    }
  });
})(angular);
