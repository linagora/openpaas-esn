'use strict';

angular.module('esn.project', [
  'restangular',
  'esn.avatar',
  'esn.session',
  'esn.core',
  'esn.activitystreams-tracker',
  'esn.notification',
  'angularFileUpload',
  'mgcrea.ngStrap.tooltip',
  'mgcrea.ngStrap.helpers.dimensions',
  'mgcrea.ngStrap.helpers.dateParser',
  'mgcrea.ngStrap.datepicker'
])
  .config(function($routeProvider, routeResolver) {

    $routeProvider.when('/project/:project_id', {
      templateUrl: '/project/views/partials/project',
      controller: 'projectController',
      resolve: {
        project: routeResolver.api('projectAPI', 'get', 'project_id', '/project')
      }
    });

    $routeProvider.when('/project', {
      templateUrl: '/project/views/projects',
      controller: 'projectsController',
      resolve: {
        domain: routeResolver.session('domain'),
        user: routeResolver.session('user')
      }
    });

    $routeProvider.when('/collaborations/project/:project_id/members', {
      templateUrl: '/project/views/project-members',
      controller: 'projectController',
      resolve: {
        project: routeResolver.api('projectAPI', 'get', 'project_id', '/project')
      }
    });
  })
  .run(function(projectAdapterService, objectTypeAdapter, ASTrackerSubscriptionService, projectAPI) {
    objectTypeAdapter.register('project', projectAdapterService);
    ASTrackerSubscriptionService.register('project', {get: projectAPI.get});
  });
