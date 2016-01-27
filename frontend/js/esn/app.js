'use strict';

var angularInjections = angularInjections || [];

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
  'angular-nicescroll',
  'xeditable',
  'op.dynamicDirective',
  'esn.core',
  'esn.member',
  'esn.header',
  'esn.sidebar',
  'esn.domain',
  'esn.avatar',
  'esn.profile',
  'esn.user',
  'esn.message',
  'esn.session',
  'esn.activitystream',
  'esn.websocket',
  'esn.community',
  'esn.collaboration',
  'esn.application',
  'esn.authentication',
  'esn.feedback',
  'esn.activitystreams-tracker',
  'esn.api-notification',
  'esn.user-notification',
  'esn.object-type',
  'esn.file',
  'esn.background',
  'esn.parser',
  'esn.markdown-parser',
  'esn.widget.helper',
  'esn.form.helper',
  'esn.twitter',
  'esn.ui',
  'esn.oembed',
  'esn.oembed.youtube',
  'esn.oembed.instagram',
  'esn.oembed.soundcloud',
  'esn.oembed.deezer',
  'esn.oembed.vimeo',
  'esn.oembed.slideshare',
  'esn.oembed.codepen',
  'esn.oembed.gist',
  'esn.oembed.twitter',
  'esn.injection',
  'esn.collaboration',
  'esn.company',
  'esn.localstorage',
  'esn.http',
  'esn.attendee',
  'esn.back-detector',
  'esn.offline-wrapper',
  'esn.actionList',
  'esn.application-menu'
].concat(angularInjections)).config(function(RestangularProvider, routeResolver, $urlRouterProvider, $stateProvider) {

  // don't remove $injector, otherwise $location is not correctly injected...
  $urlRouterProvider.otherwise(function($injector, $location) {
    return $location.search().continue || '/communities';
  });

  $stateProvider
  .state('/domains/:id/members/invite', {
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

        }, function(err) {
          $location.path('/');
        });
      }
    }
  })
  .state('/profile', {
    url: '/profile',
    templateUrl: '/views/esn/partials/profile',
    controller: 'profileViewController',
    resolve: {
      user: function($location, userAPI) {
        return userAPI.currentUser().then(function(response) {
          return response.data;
        }, function() {
          $location.path('/');
        });
      }
    }
  })
  .state('/profile/:user_id', {
    url: '/profile/:user_id',
    templateUrl: '/views/esn/partials/profile',
    controller: 'profileViewController',
    resolve: {
      user: function($stateParams, $location, userAPI) {
        return userAPI.user($stateParams.user_id).then(function(response) {
          return response.data;
        }, function() {
          $location.path('/');
        });
      }
    }
  })
  .state('/domains/:domain_id/members', {
    url: '/domains/:domain_id/members',
    templateUrl: '/views/esn/partials/members',
    controller: 'memberscontroller'
  })
  .state('/applications', {
    url: '/applications',
    templateUrl: '/views/modules/application/applications',
    controller: 'applicationController',
    resolve: {
      applications: routeResolver.api('applicationAPI', 'created', 'undefined')
    }
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
      memberOf: function(collaborationAPI, $q, $stateParams, $location) {
        return collaborationAPI.getWhereMember({
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
  });

  RestangularProvider.setBaseUrl('/api');
  RestangularProvider.setFullResponse(true);
})
// don't remove $state from here or ui-router won't route...
.run(function(session, ioConnectionManager, editableOptions, $state) {
  editableOptions.theme = 'bs3';
  session.ready.then(function() {
    ioConnectionManager.connect();
  });
});
