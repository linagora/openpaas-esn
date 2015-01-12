'use strict';

angular.module('esn.collaboration', ['restangular'])
  .controller('collaborationListController', ['$scope', 'domain', 'user', function($scope, domain, user) {
    $scope.domain = domain;
    $scope.user = user;
  }])
  .directive('collaborationCreateButton', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/collaboration/create-collaboration-button.html'
    };
  })
  .factory('collaborationAPI', ['Restangular', function(Restangular) {
    function getWhereMember(tuple) {
      return Restangular.all('collaborations/membersearch').getList(tuple);
    }

    return {
      getWhereMember: getWhereMember
    };
  }]);
