'use strict';

angular.module('esn.appstore', [
  'esn.router',
  'esn.http',
  'esn.community',
  'mgcrea.ngStrap.alert',
  'mgcrea.ngStrap.modal',
  'angularFileUpload',
  'restangular',
  'angularFileUpload',
  'frapontillo.bootstrap-switch',
  'op.dynamicDirective',
  'esn.feature-registry'
]).config(function($stateProvider, dynamicDirectiveServiceProvider) {

  $stateProvider.state('controlcenter.appstore', {
    url: '/appstore',
    templateUrl: '/appstore/views/appstore/appstore',
    controller: 'appstoreController'
  })
  .state('/appstore/apps/:id', {
    url: '/appstore/apps/:id',
    templateUrl: '/appstore/views/appstore/appstore-app-details',
    controller: 'appstoreAppController',
    resolve: {
      application: function(appstoreAPI, $stateParams, $location) {
        return appstoreAPI.get($stateParams.id).then(
          function(response) {
            return response.data;
          },
          function() {
            $location.path('/appstore');
          }
        );
      }
    }
  })
  .state('/appstore/communities/:id/apps', {
    url: '/appstore/communities/:id/apps',
    templateUrl: '/appstore/views/community/applications',
    controller: 'communityAppstoreController',
    resolve: {
      applications: function(session, appstoreAPI, $stateParams, $q) {
        var defer = $q.defer();
        session.ready.then(function(session) {
          appstoreAPI.list({ domain: session.domain._id, community: $stateParams.id }).then(
            function(response) {
              defer.resolve(response.data);
            },
            function(err) {
              defer.reject(err);
              console.log(err);
            }
          );
        });
        return defer.promise;
      },
      community: function(communityAPI, $stateParams) {
        return communityAPI.get($stateParams.id).then(
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

  var appstoreAppMenu = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-appstore', {priority: 0});
  dynamicDirectiveServiceProvider.addInjection('esn-application-menu', appstoreAppMenu);

  var appstoreControlCenterMenu = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'controlcenter-menu-appstore', {priority: -12});
  dynamicDirectiveServiceProvider.addInjection('controlcenter-sidebar-menu', appstoreControlCenterMenu);
})

.run(function(esnFeatureRegistry) {
  esnFeatureRegistry.add({
    name: 'Modules',
    configurations: [
      {
        displayIn: 'Control Center',
        name: 'control-center:appstore'
      }
    ],
    description: 'Allows user to submit new external application for current domain'
  });
});
