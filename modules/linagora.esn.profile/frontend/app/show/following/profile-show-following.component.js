(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .component('profileShowFollowing', {
      templateUrl: '/profile/app/show/following/profile-show-following.html',
      controller: 'profileShowFollowingController',
      bindings: {
        user: '<'
      }
    });
})(angular);
