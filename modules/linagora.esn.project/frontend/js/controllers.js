'use strict';

angular.module('esn.project')
  .controller('projectController', ['$scope', 'projectService', 'project',
    function($scope, projectService, project) {
      $scope.project = project;
      $scope.writable = project.writable;

      $scope.canRead = function() {
        return projectService.canRead(project);
      };
    }]);
