(function(angular) {
  'use strict';

  angular.module('esn.community').config(routerConfiguration);

  function routerConfiguration(routeResolver, $urlRouterProvider, $stateProvider) {
    $stateProvider.state('community', {
      url: '/community',
      templateUrl: '/views/modules/community/index.html',
      deepStateRedirect: {
        default: 'community.list',
        fn: function() {
          return { state: 'community.list' };
        }
      },
      resolve: {
        domain: routeResolver.session('domain'),
        user: routeResolver.session('user')
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
        community: routeResolver.api('communityAPI', 'get', 'community_id', '/communities'),
        memberOf: function() {
          return [];
        }
      }
    });
  }
})(angular);
