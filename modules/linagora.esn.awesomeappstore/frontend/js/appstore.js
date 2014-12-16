'use strict';

angular.module('esn.appstore', [
  'esn.community',
  'mgcrea.ngStrap.alert',
  'mgcrea.ngStrap.modal',
  'angularFileUpload',
  'restangular',
  'angularFileUpload'
]).config(function($routeProvider) {

    $routeProvider.when('/appstore', {
      templateUrl: '/appstore/views/appstore/appstore',
      controller: 'appstoreController'
    });

    $routeProvider.when('/appstore/apps/:id', {
      templateUrl: '/appstore/views/appstore/appstore-app-details',
      controller: 'appstoreAppController',
      resolve: {
        application: function(appstoreAPI, $route, $location) {
          return appstoreAPI.get($route.current.params.id).then(
            function(response) {
              return response.data;
            },
            function(err) {
              $location.path('/appstore');
            }
          );
        }
      }
    });

    $routeProvider.when('/appstore/communities/:id/apps', {
      templateUrl: '/appstore/views/community/applications',
      controller: 'communityAppstoreController',
      resolve: {
        applications: function(communityAppstoreAPI, $route) {
          return communityAppstoreAPI.list($route.current.params.id).then(
            function(response) {
              return response.data;
            },
            function(err) {
              console.log(err);
            }
          );
        },
        community: function(communityAPI, $route) {
          return communityAPI.get($route.current.params.id).then(
            function(response) {
              return response.data;
            },
            function(err) {
              console.log(err);
            }
          );
        }
      }
    });
  });
