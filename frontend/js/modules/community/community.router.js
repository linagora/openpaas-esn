(function(angular) {
  'use strict';

  angular.module('esn.community').config(routerConfiguration);

  function routerConfiguration(routeResolver, $stateProvider) {
    $stateProvider.state('community', {
      abstract: true,
      url: '/community',
      templateUrl: '/views/modules/community/index.html',
      deepStateRedirect: {
        default: 'community.home',
        fn: function() {
          return { state: 'community.home' };
        }
      },
      resolve: {
        isModuleActive: isModuleActive,
        domain: routeResolver.session('domain'),
        user: routeResolver.session('user')
      }
    })

    // so we can transition to `community.home` while we can't on `community`
    // this allows to chack that the module is active for all children
    .state('community.home', {
      url: '',
      deepStateRedirect: {
        default: 'community.list',
        fn: function() {
          return { state: 'community.list' };
        }
      }
    })

    .state('community.list', {
      url: '/list',
      views: {
        'main@community': {
          templateUrl: '/views/modules/community/list/community-list.html',
          controller: 'communityListController'
        }
      }
    })

    .state('community.view', {
      url: '/view/:id',
      views: {
        'main@community': {
          templateUrl: '/views/modules/community/view/community-view.html',
          controller: 'communityViewController'
        }
      },
      deepStateRedirect: {
        params: true,
        default: 'community.view.stream',
        fn: function() {
          return { state: 'community.view.stream' };
        }
      },
      resolve: {
        community: routeResolver.api('communityAPI', 'get', 'id', '/communities'),
        domain: routeResolver.session('domain'),
        memberOf: function(esnCollaborationClientService, $q, $stateParams, $state) {
          return esnCollaborationClientService.getWhereMember({
            objectType: 'community',
            id: $stateParams.id
          }).then(function(response) {
            return response.data;
          }, function() {
            $state.go('community.list');
          });
        }
      }
    })

    .state('community.view.stream', {
      url: '/stream',
      views: {
        'content@community.view': {
          template: '<activity-stream activitystream="community" writable="community.writable" streams="streams" calendar-id="community._id"></activity-stream>'
        }
      }
    })

    .state('community.view.members', {
      url: '/members',
      views: {
        'content@community.view': {
          template: '<community-members community="community"></community-members>'
        }
      }
    })

    .state('community.view.about', {
      url: '/about',
      views: {
        'content@community.view': {
          template: '<community-about community="community"></community-about>'
        }
      }
    })

    .state('/collaborations/community/:community_id/members', {
      url: '/collaborations/community/:community_id/members',
      templateUrl: '/views/modules/community/members/community-members',
      controller: 'communityViewController',
      resolve: {
        isModuleActive: isModuleActive,
        community: routeResolver.api('communityAPI', 'get', 'community_id', '/communities'),
        memberOf: function() {
          return [];
        }
      }
    });
  }

  function isModuleActive($location, communityConfiguration) {
    return communityConfiguration.get('enabled', true).then(function(isEnabled) {
      if (!isEnabled) {
        $location.path('/');
      }
    }).catch(function() {
      $location.path('/');
    });
  }
})(angular);
