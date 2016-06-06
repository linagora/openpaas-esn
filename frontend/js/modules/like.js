'use strict';

angular.module('esn.like', [
  'esn.resource-link'
])
  .directive('likeButton', likeButton)
  .constant('LIKE_LINK_TYPE', 'like');

function likeButton($log, ResourceLinkAPI, session, LIKE_LINK_TYPE) {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      liked: '=',
      targetId: '=',
      targetObjectType: '='
    },
    templateUrl: '/views/modules/like/like-button.html',
    link: function(scope) {

      scope.like = function() {
        if (scope.liked) {
          return;
        }

        var source = {
          objectType: 'user',
          id: session.user._id
        };
        var target = {
          objectType: scope.targetObjectType,
          id: scope.targetId
        };

        ResourceLinkAPI.create(source, target, LIKE_LINK_TYPE).then(function() {
          scope.liked = true;
        }, function(err) {
          $log.error('Error while liking resource', err);
        });
      };
    }
  };
}
