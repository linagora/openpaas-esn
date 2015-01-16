'use strict';

var angularInjections = angularInjections || [];

angular.module('esnApp', [
  'restangular',
  'ngRoute',
  'mgcrea.ngStrap.affix',
  'ui.notify',
  'angularMoment',
  'truncate',
  'openpaas-logo',
  'esn.core',
  'esn.member',
  'esn.domain',
  'esn.avatar',
  'esn.profile',
  'esn.user',
  'esn.message',
  'esn.session',
  'esn.activitystream',
  'esn.websocket',
  'esn.conference',
  'esn.contact',
  'esn.community',
  'esn.collaboration',
  'esn.application',
  'esn.authentication',
  'esn.feedback',
  'esn.activitystreams-tracker',
  'esn.conference-notification',
  'esn.api-notification',
  'esn.user-notification',
  'esn.calendar',
  'esn.ical',
  'esn.object-type',
  'esn.file',
  'esn.background',
  'esn.parser',
  'esn.markdown-parser',
  'esn.widget.helper',
  'esn.oembed',
  'esn.oembed.youtube',
  'esn.oembed.instagram',
  'esn.oembed.soundcloud',
  'esn.oembed.deezer',
  'esn.oembed.vimeo',
  'esn.oembed.slideshare',
  'esn.injection',
  'esn.collaboration',
  'esn.company',
  'esn.localstorage'
].concat(angularInjections)).config(function($routeProvider, RestangularProvider, routeResolver) {

    $routeProvider.when('/domains/:id/members/invite', {
      templateUrl: '/views/esn/partials/domains/invite',
      controller: 'inviteMembers',
      resolve: { domain: routeResolver.api('domainAPI') }
    });

    $routeProvider.when('/messages/:id/activitystreams/:asuuid', {
      templateUrl: '/views/esn/partials/message',
      controller: 'whatsupMessageDisplayController',
      resolve: { message: routeResolver.api('messageAPI') }
    });

    $routeProvider.when('/profile', {
      templateUrl: '/views/esn/partials/profile',
      controller: 'profilecontroller'
    });

    $routeProvider.when('/contacts', {
      templateUrl: '/views/esn/partials/contacts',
      controller: 'contactsController',
      resolve: { user: routeResolver.session('user') }
    });

    $routeProvider.when('/domains/:domain_id/members', {
      templateUrl: '/views/esn/partials/members',
      controller: 'memberscontroller'
    });

    $routeProvider.when('/conferences', {
      templateUrl: '/views/esn/partials/conference',
      controller: 'conferencesController',
      resolve: { conferences: routeResolver.api('conferenceAPI', 'list') }
    });

    $routeProvider.when('/applications', {
      templateUrl: '/views/modules/application/applications',
      controller: 'applicationController',
      resolve: {
        applications: routeResolver.api('applicationAPI', 'created', 'undefined')
      }
    });

    $routeProvider.when('/applications/:application_id', {
      templateUrl: '/views/modules/application/application-details',
      controller: 'applicationDetailsController',
      resolve: {
        application: routeResolver.api('applicationAPI', 'get', 'application_id', '/applications')
      }
    });

    $routeProvider.when('/communities', {
      templateUrl: '/views/esn/partials/communities',
      controller: 'communitiesController',
      resolve: {
        domain: routeResolver.session('domain'),
        user: routeResolver.session('user')
      }
    });

    $routeProvider.when('/communities/:community_id', {
      templateUrl: '/views/esn/partials/community',
      controller: 'communityController',
      resolve: {
        community: routeResolver.api('communityAPI', 'get', 'community_id', '/communities'),
        memberOf: function(collaborationAPI, $q, $route, $location) {
          return collaborationAPI.getWhereMember({
            objectType: 'community',
            id: $route.current.params.community_id
          }).then(function(response) {
            return response.data;
          }, function() {
            $location.path('/communities');
          });
        }
      }
    });

    $routeProvider.when('/communities/:community_id/members', {
      templateUrl: '/views/modules/community/community-members',
      controller: 'communityController',
      resolve: {
        community: routeResolver.api('communityAPI', 'get', 'community_id', '/communities'),
        memberOf: function() {
          return [];
        }
      }
    });

    $routeProvider.when('/communities/:community_id/calendar', {
      templateUrl: '/views/modules/community/community-calendar',
      controller: 'communityCalendarController',
      resolve: {
        community: routeResolver.api('communityAPI', 'get', 'community_id', '/communities')
      }
    });

    $routeProvider.otherwise({redirectTo: '/communities'});

    RestangularProvider.setBaseUrl('/api');
    RestangularProvider.setFullResponse(true);
  })
.run(['session', 'ioConnectionManager', function(session, ioConnectionManager) {
  session.ready.then(function() {
    ioConnectionManager.connect();
  });
}]);
