'use strict';

angular.module('esn.project', [
  'restangular',
  'esn.avatar',
  'esn.session',
  'esn.activitystreams-tracker',
  'angularFileUpload',
  'mgcrea.ngStrap.tooltip',
  'mgcrea.ngStrap.helpers.dimensions',
  'mgcrea.ngStrap.helpers.dateParser',
  'mgcrea.ngStrap.datepicker'
])
  .config(function($routeProvider) {

    $routeProvider.when('/projects/:project_id', {
      templateUrl: '/projects/views/partials/project',
      controller: 'projectController',
      resolve: {
        project: function(projectAPI, $route, $location) {
          return projectAPI.get($route.current.params.project_id).then(
            function(response) {
              return response.data;
            },
            function(err) {
              $location.path('/projects');
            }
          );
        }
      }
    });

    $routeProvider.when('/projects', {
      templateUrl: '/projects/views/projects',
      controller: 'projectsController',
      resolve: {
        domain: ['session', '$q', function(session, $q) {
          return $q.when(session.domain);
        }],
        user: ['session', '$q', function(session, $q) {
          return $q.when(session.user);
        }]
      }
    });

  })
  .run(['projectAdapterService', 'objectTypeAdapter', function(projectAdapterService, objectTypeAdapter) {
    objectTypeAdapter.register('project', projectAdapterService);
  }]);
