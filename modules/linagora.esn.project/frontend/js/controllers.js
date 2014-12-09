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
    }]);
