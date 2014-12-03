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
  'esn.application',
  'esn.authentication',
  'esn.feedback',
  'esn.community-as-tracker',
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
  'esn.widget.helper'
].concat(angularInjections)).config(function($routeProvider, RestangularProvider) {
    $routeProvider.when('/domains/:id/members/invite', {
      templateUrl: '/views/esn/partials/domains/invite',
      controller: 'inviteMembers',
      resolve: {
        domain: function(domainAPI, $route, $location) {
          return domainAPI.get($route.current.params.id).then(
            function(response) {
              return response.data;
            },
            function(err) {
              $location.path('/');
            }
          );
        }
      }
    });

    $routeProvider.when('/messages/:id/activitystreams/:asuuid', {
      templateUrl: '/views/esn/partials/message',
      controller: 'whatsupMessageDisplayController',
      resolve: {
        message: function(messageAPI, $route, $location) {
          return messageAPI.get($route.current.params.id).then(
            function(response) {
              return response.data;
            },
            function(err) {
              $location.path('/');
            }
          );
        }
      }
    });

    $routeProvider.when('/profile', {
      templateUrl: '/views/esn/partials/profile',
      controller: 'profilecontroller'
    });

    $routeProvider.when('/contacts', {
      templateUrl: '/views/esn/partials/contacts',
      controller: 'contactsController',
      resolve: {
        addressbookOwner: function($q, session) {
          var d = $q.defer();
          session.ready.then(function(session) {
            d.resolve(session.user._id);
          });
          return d.promise;
        }
      }
    });

    $routeProvider.when('/domains/:domain_id/members', {
      templateUrl: '/views/esn/partials/members',
      controller: 'memberscontroller'
    });

    $routeProvider.when('/conferences', {
      templateUrl: '/views/esn/partials/conference',
      controller: 'conferencesController',
      resolve: {
        conferences: function(conferenceAPI, $location) {
          return conferenceAPI.list().then(
            function(response) {
              return response.data;
            },
            function(err) {
              $location.path('/');
            }
          );
        }
      }
    });

    $routeProvider.when('/applications', {
      templateUrl: '/views/modules/application/applications',
      controller: 'applicationController',
      resolve: {
        applications: function(applicationAPI, $location) {
          return applicationAPI.created().then(
            function(response) {
              return response.data;
            },
            function(err) {
              $location.path('/');
            }
          );
        }
      }
    });

    $routeProvider.when('/applications/:application_id', {
      templateUrl: '/views/modules/application/application-details',
      controller: 'applicationDetailsController',
      resolve: {
        application: function(applicationAPI, $route, $location) {
          return applicationAPI.get($route.current.params.application_id).then(
            function(response) {
              return response.data;
            },
            function(err) {
              $location.path('/applications');
            }
          );
        }
      }
    });


    $routeProvider.when('/communities', {
      templateUrl: '/views/esn/partials/communities',
      controller: 'communitiesController',
      resolve: {
        domain: ['session', '$q', function(session, $q) {
          return $q.when(session.domain);
        }],
        user: ['session', '$q', function(session, $q) {
          return $q.when(session.user);
        }]
      }
    });

    $routeProvider.when('/communities/:community_id', {
      templateUrl: '/views/esn/partials/community',
      controller: 'communityController',
      resolve: {
        community: function(communityAPI, $route, $location) {
          return communityAPI.get($route.current.params.community_id).then(
            function(response) {
              return response.data;
            },
            function(err) {
              $location.path('/communities');
            }
          );
        }
      }
    });

    $routeProvider.when('/communities/:community_id/members', {
      templateUrl: '/views/modules/community/community-members',
      controller: 'communityController',
      resolve: {
        community: function(communityAPI, $route, $location) {
          return communityAPI.get($route.current.params.community_id).then(
            function(response) {
              return response.data;
            },
            function(err) {
              $location.path('/communities/' + $route.current.params.community_id);
            }
          );
        }
      }
    });

    $routeProvider.when('/communities/:community_id/calendar', {
      templateUrl: '/views/modules/community/community-calendar'
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
