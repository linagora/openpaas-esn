'use strict';

var angularInjections = window.angularInjections || [];

angular.module('esnApp', [
  'restangular',
  'ct.ui.router.extras',
  'mgcrea.ngStrap.affix',
  'mgcrea.ngStrap.modal',
  'mgcrea.ngStrap.aside',
  'angularMoment',
  'angular-clockpicker',
  'truncate',
  'openpaas-logo',
  'frapontillo.bootstrap-switch',
  'chart.js',
  'FBAngular',
  'materialAdmin',
  'xeditable',
  'mp.autoFocus',
  'op.dynamicDirective',
  'awesome-angular-swipe',
  'uuid4',
  'luegg.directives'
].concat(angularInjections))

.config(function(routeResolver, $urlRouterProvider, $stateProvider) {

  // don't remove $injector, otherwise $location is not correctly injected...
  $urlRouterProvider.otherwise(function($injector, $location) {
    return $location.search().continue || '/';
  });

  $urlRouterProvider.when('/', function($location, esnRouterHelper) {
    if ($location.search().continue) {
      return $location.search().continue;
    }

    esnRouterHelper.goToHomePage();
  });

  $stateProvider
  .state('home', {
    url: '/'
  })
  .state('controlcenter.domainInviteMembers', {
    url: '/domains/:id/members/invite',
    templateUrl: '/views/esn/partials/domains/invite',
    controller: 'inviteMembers',
    resolve: { domain: routeResolver.api('domainAPI') }
  })
  .state('/messages/:id/activitystreams/:asuuid', {
    url: '/messages/:id/activitystreams/:asuuid',
    templateUrl: '/views/esn/partials/message',
    controller: 'singleMessageDisplayController',
    resolve: {
      message: routeResolver.api('messageAPI'),
      activitystream: function($stateParams, $location, activitystreamAPI, objectTypeResolver) {
        return activitystreamAPI.getResource($stateParams.asuuid).then(function(response) {
          var objectType = response.data.objectType;
          var id = response.data.object._id;

          return objectTypeResolver.resolve(objectType, id).then(function(collaboration) {
            return collaboration.data;
          }, function() {
            $location.path('/');
          });

        }, function() {
          $location.path('/');
        });
      }
    }
  })

  .state('controlcenter.domainMembers', {
    url: '/domains/:domain_id/members',
    templateUrl: '/views/esn/partials/members',
    controller: 'memberscontroller'
  })
  .state('controlcenter.applications', {
    url: '/applications',
    templateUrl: '/views/modules/application/applications',
    controller: 'applicationController',
    resolve: {
      applications: routeResolver.api('applicationAPI', 'created', 'undefined')
    }
  })
  .state('controlcenter.changepassword', {
    url: '/changepassword',
    templateUrl: '/views/modules/login/changepassword',
    controller: 'changePasswordController'
  })
  .state('controlcenter.timeline', {
    url: '/timeline',
    templateUrl: '/views/modules/timeline/index',
    controller: 'esnTimelineEntriesController'
  })
  .state('/applications/:application_id', {
    url: '/applications/:application_id',
    templateUrl: '/views/modules/application/application-details',
    controller: 'applicationDetailsController',
    resolve: {
      application: routeResolver.api('applicationAPI', 'get', 'application_id', '/applications')
    }
  })
  .state('/communities', {
    url: '/communities',
    templateUrl: '/views/esn/partials/communities',
    controller: 'communitiesController',
    resolve: {
      domain: routeResolver.session('domain'),
      user: routeResolver.session('user')
    }
  })
  .state('/communities/:community_id', {
    url: '/communities/:community_id',
    templateUrl: '/views/esn/partials/community',
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
    templateUrl: '/views/modules/community/community-members',
    controller: 'communityController',
    resolve: {
      community: routeResolver.api('communityAPI', 'get', 'community_id', '/communities'),
      memberOf: function() {
        return [];
      }
    }
  })
  .state('search', {
    url: '/search',
    abstract: true,
    templateUrl: '/views/modules/search/index'
  })
  .state('search.main', {
    url: '?q',
    params: {
      q: {
        value: '',
        squash: true
      },
      filters: null
    },
    views: {
      'search-desktop-sidebar': {
        templateUrl: '/views/modules/search/desktop-sidebar.html',
        controller: 'searchSidebarController'
      },
      'search-result': {
        templateUrl: '/views/modules/search/search-result',
        controller: 'searchResultController'
      }
    }
  });

})
// don't remove $state from here or ui-router won't route...
.run(function(session, ioConnectionManager, editableOptions, $state, $rootScope, HEADER_VISIBILITY_EVENT, HEADER_DISABLE_SCROLL_LISTENER_EVENT) { // eslint-disable-line
  editableOptions.theme = 'bs3';
  session.ready.then(function() {
    ioConnectionManager.connect();
  });

  $rootScope.$on('$stateChangeSuccess', function(e, toState, toParams, fromState) {
    var fromStateHeaderVisibility = fromState.data ? fromState.data.headerVisibility : true,
        toStateHeaderVisibility = toState.data ? toState.data.headerVisibility : true;

    if (fromStateHeaderVisibility !== toStateHeaderVisibility) {
      $rootScope.$broadcast(HEADER_DISABLE_SCROLL_LISTENER_EVENT, !toStateHeaderVisibility);
      $rootScope.$broadcast(HEADER_VISIBILITY_EVENT, toStateHeaderVisibility);
    }
  });
});
