'use strict';

angular.module('esn.follow', [
    'esn.resource-link',
    'esn.timeline'
  ])
  .constant('FOLLOW_LINK_TYPE', 'follow')

  .run(function(esnTimelineEntryProviders, FOLLOW_LINK_TYPE) {
    esnTimelineEntryProviders.register({
      verb: FOLLOW_LINK_TYPE,
      templateUrl: '/views/modules/follow/timeline/follow.html',
      canHandle: function() {
        return true;
      }
    });
  })

  .factory('followAPI', function(ResourceLinkAPI, esnRestangular, session, FOLLOW_LINK_TYPE) {

    function follow(user) {

      var source = {
        objectType: 'user',
        id: session.user._id
      };
      var target = {
        objectType: 'user',
        id: user._id
      };

      return ResourceLinkAPI.create(source, target, FOLLOW_LINK_TYPE);
    }

    function unfollow(user) {
      var source = {
        objectType: 'user',
        id: session.user._id
      };
      var target = {
        objectType: 'user',
        id: user._id
      };

      return ResourceLinkAPI.remove(source, target, FOLLOW_LINK_TYPE);
    }

    function getFollowers(user, options) {
      return esnRestangular.one('users', user._id).getList('followers', options);
    }

    function getFollowings(user, options) {
      return esnRestangular.one('users', user._id).getList('followings', options);
    }

    return {
      follow: follow,
      unfollow: unfollow,
      getFollowers: getFollowers,
      getFollowings: getFollowings
    };
  })

  .directive('followCard', function(session) {
    return {
      restrict: 'E',
      scope: {
        user: '='
      },
      templateUrl: '/views/modules/follow/follow-card.html',
      link: function(scope) {
        scope.me = session.user._id === scope.user._id;

        scope.addFollower = function() {
          scope.user.followers++;
        };

        scope.removeFollower = function() {
          if (scope.user.followers) {
            scope.user.followers--;
          }
        };
      }
    };
  })

  .directive('followButton', function($log, followAPI) {

    return {
      restrict: 'E',
      scope: {
        following: '=',
        user: '=',
        onFollowed: '&',
        onUnfollowed: '&'
      },
      templateUrl: '/views/modules/follow/follow-button.html',
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
  });
