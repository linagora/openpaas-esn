'use strict';

angular.module('esn.project', [
  'restangular',
  'esn.avatar',
  'esn.session',
  'esn.core',
  'esn.activitystreams-tracker',
  'angularFileUpload',
  'mgcrea.ngStrap.tooltip',
  'mgcrea.ngStrap.helpers.dimensions',
  'mgcrea.ngStrap.helpers.dateParser',
  'mgcrea.ngStrap.datepicker'
])
  .config(['$routeProvider', 'routeResolver', function($routeProvider, routeResolver) {

    $routeProvider.when('/projects/:project_id', {
      templateUrl: '/projects/views/partials/project',
      controller: 'projectController',
      resolve: {
        project: routeResolver.api('projectAPI', 'get', 'project_id', '/projects')
      }
    });

    $routeProvider.when('/projects', {
      templateUrl: '/projects/views/projects',
      controller: 'projectsController',
      resolve: {
        domain: routeResolver.session('domain'),
        user: routeResolver.session('user')
      }
    });

    $routeProvider.when('/projects/:project_id/members', {
      templateUrl: '/views/modules/collaboration/collaboration-members',
      controller: 'collaborationController',
      resolve: {
        collaboration: routeResolver.api('projectAPI', 'get', 'project_id', '/projects')
      }
    });
  }])
  .run(['projectAdapterService', 'objectTypeAdapter', function(projectAdapterService, objectTypeAdapter) {
    objectTypeAdapter.register('project', projectAdapterService);
  }]);
