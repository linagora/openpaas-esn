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
          templateUrl: '/views/modules/community/community.html',
          controller: 'communityController'
        }
      },
      resolve: {
        community: routeResolver.api('communityAPI', 'get', 'id', '/communities'),
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

    .state('/collaborations/community/:community_id/members', {
      url: '/collaborations/community/:community_id/members',
      templateUrl: '/views/modules/community/members/community-members',
      controller: 'communityController',
      resolve: {
        community: routeResolver.api('communityAPI', 'get', 'community_id', '/communities'),
        memberOf: function() {
          return [];
        }
      }
    });
  }
})(angular);
