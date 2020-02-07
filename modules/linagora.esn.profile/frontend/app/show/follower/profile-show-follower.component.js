(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .component('profileShowFollower', {
      templateUrl: '/profile/app/show/follower/profile-show-follower.html',
      controller: 'profileShowFollowerController',
      bindings: {
        user: '<'
      }
    });
})(angular);
