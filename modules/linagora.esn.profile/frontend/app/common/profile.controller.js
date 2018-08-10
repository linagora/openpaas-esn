(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .controller('profileController', profileController);

  function profileController($scope, session, user) {
    $scope.user = user;
    $scope.me = session.user._id === $scope.user._id;
    $scope.canEdit = $scope.me || session.userIsDomainAdministrator();
  }
})(angular);
