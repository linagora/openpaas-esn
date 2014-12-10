'use strict';

angular.module('esn.collaboration', [''])
  .controller('collaborationListController', ['$scope', 'domain', 'user', function($scope, domain, user) {
    $scope.domain = domain;
    $scope.user = user;
  }])
  .directive('collaborationCreateButton', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/collaboration/create-collaboration-button.html'
    };
  });
