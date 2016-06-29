'use strict';

angular.module('esn.follow', [
    'esn.resource-link',
    'esn.timeline'
  ])
  .constant('FOLLOW_LINK_TYPE', 'follow')
  .constant('UNFOLLOW_LINK_TYPE', 'unfollow')

  .run(function(esnTimelineEntryProviders, FOLLOW_LINK_TYPE, UNFOLLOW_LINK_TYPE) {
    esnTimelineEntryProviders.register({
      verb: FOLLOW_LINK_TYPE,
      templateUrl: '/views/modules/follow/timeline/follow.html',
      canHandle: function() {
        return true;
      }
    });

    esnTimelineEntryProviders.register({
      verb: UNFOLLOW_LINK_TYPE,
      templateUrl: '/views/modules/follow/timeline/unfollow.html',
      canHandle: function() {
        return true;
      }
    });
  })

  .factory('followAPI', function(esnRestangular, session) {

    function follow(user) {
      return esnRestangular.all('users').one(session.user._id).one('followings', user._id).customPUT();
    }

    function unfollow(user) {
      return esnRestangular.all('users').one(session.user._id).all('followings').customDELETE(user._id);
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
