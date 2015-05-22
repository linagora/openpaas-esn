'use strict';

angular.module('linagora.esn.contact')
  .controller('contactController', ['$scope', 'user', function($scope, user) {
    $scope.user = user;
  }])
  .controller('newContactController', ['$scope', '$route', '$location', 'user', function($scope, $route, $location, user) {
    $scope.bookId = $route.current.params.bookId;
    $scope.close = function() {
      $location.path('/contacts');
    };
  }]);
