(function(angular) {
  'use strict';

  angular.module('esn.community').config(routerConfiguration);

  function routerConfiguration(routeResolver, $urlRouterProvider, $stateProvider) {
    $stateProvider.state('/communities', {
      url: '/communities',
      templateUrl: '/views/modules/community/list/community-list.html',
      controller: 'communityListController',
      resolve: {
        domain: routeResolver.session('domain'),
        user: routeResolver.session('user')
      }
    })
    .state('/communities/:community_id', {
      url: '/communities/:community_id',
      templateUrl: '/views/modules/community/community.html',
      controller: 'communityController',
      resolve: {
        community: routeResolver.api('communityAPI', 'get', 'community_id', '/communities'),
        memberOf: function(esnCollaborationClientService, $q, $stateParams, $location) {
          return esnCollaborationClientService.getWhereMember({
            objectType: 'community',
            id: $stateParams.community_id
          }).then(function(response) {
            return response.data;
          }, function() {
            $location.path('/communities');
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
