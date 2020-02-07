(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .controller('profileController', profileController);

  function profileController($scope, profileHelpersService, user) {
    $scope.user = user;
    $scope.me = profileHelpersService.isMe(user);
    $scope.canEdit = profileHelpersService.canEdit(user);
  }
})(angular);
