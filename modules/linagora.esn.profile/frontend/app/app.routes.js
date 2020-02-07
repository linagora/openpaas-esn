(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .config(function($stateProvider, $urlRouterProvider) {
      $urlRouterProvider.when('/profile', '/profile/details/view');
      $urlRouterProvider.when('/profile/:user_id', '/profile/:user_id/details/view');

      $stateProvider
        .state('profile', {
          url: '/profile/:user_id?',
          templateUrl: '/profile/app/app',
          controller: 'profileController',
          params: {user_id: {value: null, squash: true}},
          resolve: {
            user: function($stateParams, $location, userAPI, session) {
              return session.ready.then(function(session) {
                if ($stateParams.user_id && $stateParams.user_id !== session.user._id) {
                  return userAPI.user($stateParams.user_id).then(function(response) {
                    return response.data;
                  }, function() {
                    $location.path('/');
                  });
                }

                $stateParams.user_id = null;

                return session.user;
              });
            }
          }
        })

        .state('profile.details', {
          url: '/details',
          views: {
            'root@profile': {
              template: '<profile-show user="user", me="me", can-edit="canEdit" />'
            }
          }
        })

        .state('profile.details.edit', {
          url: '/edit',
          views: {
            'root@profile': {
              template: '<profile-edit user="user" />'
            }
          }
        })

        .state('profile.details.view', {
          url: '/view',
          views: {
            'details@profile.details': {
              template: '<profile-show-details user="user" />'
            }
          }
        })
        .state('profile.details.followers', {
          url: '/followers',
          views: {
            'details@profile.details': {
              template: '<profile-show-follower user="user" />'
            }
          }
        })
        .state('profile.details.followings', {
          url: '/followings',
          views: {
            'details@profile.details': {
              template: '<profile-show-following user="user" />'
            }
          }
        })
        .state('profile.details.timeline', {
          url: '/timeline',
          views: {
            'details@profile.details': {
              template: '<profile-show-timeline />'
            }
          }
        });
    });

})(angular);
