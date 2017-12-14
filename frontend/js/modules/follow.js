'use strict';

angular.module('esn.follow', [
  'esn.resource-link',
  'esn.timeline',
  'esn.session',
  'esn.http',
  'esn.aggregator',
  'esn.infinite-list',
  'esn.constants',
  'openpaas-logo'
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
  })

  .directive('followList', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/follow/list.html'
    };
  })

  .factory('FollowPaginationHelper', function(FollowPaginationProvider, followAPI) {

    function buildFollowersPaginationProvider(options, user) {
      return new FollowPaginationProvider(followAPI.getFollowers, options, user);
    }

    function buildFollowingsPaginationProvider(options, user) {
      return new FollowPaginationProvider(followAPI.getFollowings, options, user);
    }

    return {
      buildFollowersPaginationProvider: buildFollowersPaginationProvider,
      buildFollowingsPaginationProvider: buildFollowingsPaginationProvider
    };

  })

  .factory('FollowPaginationProvider', function() {

    function FollowPaginationProvider(paginable, options, user) {
      this.paginable = paginable;
      this.options = angular.extend({limit: 20, offset: 0}, options);
      this.user = user;
    }

    FollowPaginationProvider.prototype.loadNextItems = function() {
      var self = this;

      return self.paginable(self.user, self.options).then(function(response) {
        var result = {
          data: response.data,
          lastPage: (response.data.length < self.options.limit)
        };

        if (!result.lastPage) {
          self.options.offset += self.options.limit;
        }
        return result;
      });
    };
    return FollowPaginationProvider;
  })

  .factory('FollowScrollBuilder', function(infiniteScrollHelperBuilder, PageAggregatorService, _, FOLLOW_PAGE_SIZE) {

    function build($scope, name, provider, updateScope) {

      var aggregator;

      function loadNextItems() {
        aggregator = aggregator || new PageAggregatorService(name, [provider], {
          compare: function(a, b) {
            return b.link.timestamps.creation - a.link.timestamps.creation;
          },
          results_per_page: FOLLOW_PAGE_SIZE
        });
        return aggregator.loadNextItems().then(_.property('data'), _.constant([]));
      }

      return infiniteScrollHelperBuilder($scope, loadNextItems, updateScope, FOLLOW_PAGE_SIZE);
    }

    return {
      build: build
    };
  })

  .controller('followerListController', function($scope, FollowScrollBuilder, FollowPaginationHelper, _, FOLLOW_PAGE_SIZE) {
    $scope.users = [];
    $scope.loadNext = FollowScrollBuilder.build($scope, 'followers', FollowPaginationHelper.buildFollowersPaginationProvider({limit: FOLLOW_PAGE_SIZE}, $scope.user), function(elements) {
      Array.prototype.push.apply($scope.users, _.map(elements, 'user'));
    });
  })

  .controller('followingListController', function($scope, FollowScrollBuilder, FollowPaginationHelper, _, FOLLOW_PAGE_SIZE) {
    $scope.users = [];
    $scope.loadNext = FollowScrollBuilder.build($scope, 'followings', FollowPaginationHelper.buildFollowingsPaginationProvider({limit: FOLLOW_PAGE_SIZE}, $scope.user), function(elements) {
      Array.prototype.push.apply($scope.users, _.map(elements, 'user'));
    });
  });
