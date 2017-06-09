'use strict';

angular.module('linagora.esn.profile', [
  'ui.router',
  'esn.http',
  'esn.user',
  'esn.session',
  'esn.profile',
  'esn.notification',
  'esn.timeline',
  'esn.previous-page',
  'op.dynamicDirective',
  'esn.i18n'
  ])
  .config(function($stateProvider) {
    $stateProvider

      .state('profileEdit', {
        url: '/profileedit',
        templateUrl: '/profile/views/edit',
        controller: 'profileEditionController',
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
      .state('profile', {
        url: '/profile/:user_id?',
        templateUrl: '/profile/views/index',
        controller: 'profileController',
        params: {user_id: {value: null, squash: true}},
        deepStateRedirect: {
          default: 'profile.details.view',
          params: true,
          fn: function() {
            return {state: 'profile.details.view'};
          }
        },
        resolve: {
          user: function($stateParams, $location, userAPI, session, $q) {

            if ($stateParams.user_id) {
              return userAPI.user($stateParams.user_id).then(function(response) {
                return response.data;
              }, function() {
                $location.path('/');
              });
            }

            return $q.when(session.user);
          }
        }
      })

      .state('profile.details', {
        abstract: true,
        url: '/details',
        views: {
          'main@profile': {
            templateUrl: '/profile/views/partials/profile-tabs'
          }
        }
      })

      .state('profile.details.view', {
        url: '/view',
        views: {
          'details@profile.details': {
            templateUrl: '/profile/views/partials/profile-view'
          }
        }
      })
      .state('profile.details.followers', {
        url: '/followers',
        views: {
          'details@profile.details': {
            template: '<follow-list></follow-list>',
            controller: 'followerListController'
          }
        }
      })
      .state('profile.details.followings', {
        url: '/followings',
        views: {
          'details@profile.details': {
            template: '<follow-list></follow-list>',
            controller: 'followingListController'
          }
        }
      })
      .state('profile.details.timeline', {
        url: '/timeline',
        views: {
          'details@profile.details': {
            templateUrl: '/views/modules/timeline/index',
            controller: 'esnTimelineEntriesController'
          }
        }
      });
  });
