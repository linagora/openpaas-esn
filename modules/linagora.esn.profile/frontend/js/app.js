'use strict';

angular.module('linagora.esn.profile', [
  'op.dynamicDirective',
  'ui.router',
  'esn.http',
  'esn.user',
  'esn.session',
  'esn.profile'
  ])
  .config(function($stateProvider, dynamicDirectiveServiceProvider) {
    $stateProvider
      .state('controlcenter.profile', {
        url: '/profile',
        templateUrl: '/profile/views/profile',
        controller: 'profileController',
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
        templateUrl: '/profile/views/profile',
        controller: 'profileController',
        resolve: {
          user: function($stateParams, $location, userAPI) {
            return userAPI.user($stateParams.user_id).then(function(response) {
              return response.data;
            }, function() {
              $location.path('/');
            });
          }
        }
      });

    var profileControlCenterMenu = new dynamicDirectiveServiceProvider.DynamicDirective(
      true, 'controlcenter-menu-profile', { priority: -1 });

    dynamicDirectiveServiceProvider.addInjection('controlcenter-sidebar-menu', profileControlCenterMenu);

  });
