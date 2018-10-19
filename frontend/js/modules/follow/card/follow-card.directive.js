(function(angular) {
  'use strict';

  angular.module('esn.follow').directive('followCard', followCard);

  function followCard(session) {
    return {
      restrict: 'E',
      scope: {
        user: '='
      },
      templateUrl: '/views/modules/follow/card/follow-card.html',
      link: function(scope) {
        scope.me = session.user._id === scope.user._id;

        scope.addFollower = function() {
          scope.user.followers++;
          session.user.followings++;
        };

        scope.removeFollower = function() {
          if (scope.user.followers) {
            scope.user.followers--;
          }

          if (session.user.followings) {
            session.user.followings--;
          }
        };
      }
    };
  }

})(angular);
