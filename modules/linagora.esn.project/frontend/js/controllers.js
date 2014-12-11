'use strict';

angular.module('esn.project')
  .controller('projectController', ['$scope', 'projectService', 'session', 'project',
    function($scope, projectService, session, project) {
      $scope.project = project;
      $scope.writable = project.writable;

      $scope.canRead = function() {
        return projectService.canRead(project);
      };

      $scope.isProjectManager = function() {
        return projectService.isManager($scope.project, session.user);
      };
    }])
  .controller('projectsController', ['$scope', '$log', '$location', 'projectAPI', 'domain', 'user',
    function($scope, $log, $location, projectAPI, domain, user) {
      $scope.projects = [];
      $scope.error = false;
      $scope.loading = false;
      $scope.user = user;
      $scope.domain = domain;
      $scope.selected = '';

      $scope.getAll = function() {
        $scope.selected = 'all';
        $scope.loading = true;
        projectAPI.list(domain._id).then(
          function(response) {
            $scope.projects = response.data;
          },
          function(err) {
            $log.error('Error while getting projects', err);
            $scope.error = true;
            $scope.projects = [];
          }
        ).finally (
          function() {
            $scope.loading = false;
          }
        );
      };

      $scope.getMembership = function() {
        $scope.selected = 'membership';
        return $scope.getAll();
      };

      $scope.getModerator = function() {
        $scope.selected = 'moderator';
        return $scope.getAll();
      };

      $scope.getAll();
  }]);
