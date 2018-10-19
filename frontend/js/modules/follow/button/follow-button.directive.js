(function(angular) {
  'use strict';

  angular.module('esn.follow').directive('followButton', followButton);

  function followButton($log, followAPI) {
    return {
      restrict: 'E',
      scope: {
        following: '=',
        user: '=',
        onFollowed: '&',
        onUnfollowed: '&'
      },
      templateUrl: '/views/modules/follow/button/follow-button.html',
      link: function(scope) {

        scope.unfollow = function() {
          if (!scope.following) {
            return;
          }

          followAPI.unfollow(scope.user).then(function() {
            scope.following = false;
            scope.onUnfollowed(scope.user);
          }, function(err) {
            $log.error('Error while following user', err);
          });
        };

        scope.follow = function() {
          if (scope.following) {
            return;
          }

          followAPI.follow(scope.user).then(function() {
            scope.following = true;
            scope.onFollowed(scope.user);
          }, function(err) {
            $log.error('Error while following user', err);
          });
        };
      }
    };
  }
})(angular);
